import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Approval, Client, Comment, Content, ContentCard, Media, MediaWithUrl, Suggestion, TitleOption } from "./types";

const SIGN_TTL = 60 * 60; // 1h

export async function signPaths(supabase: SupabaseClient, paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return new Map<string, string>();
  const { data } = await supabase.storage.from("media").createSignedUrls(unique, SIGN_TTL);
  const map = new Map<string, string>();
  data?.forEach((d) => {
    if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
  });
  return map;
}

export async function withUrls(supabase: SupabaseClient, media: Media[]): Promise<MediaWithUrl[]> {
  const urls = await signPaths(
    supabase,
    media.map((m) => m.storage_path),
  );
  return media.map((m) => ({ ...m, url: urls.get(m.storage_path) ?? null }));
}

/** Escolhe a capa de cada conteúdo: a mídia marcada como escolhida, senão a primeira. */
export async function attachCovers(supabase: SupabaseClient, contents: Content[]): Promise<ContentCard[]> {
  if (!contents.length) return [];
  const { data: media } = await supabase
    .from("media")
    .select("content_id, storage_path, is_selected, sort_order, created_at")
    .in(
      "content_id",
      contents.map((c) => c.id),
    )
    .order("sort_order")
    .order("created_at");

  const cover = new Map<string, string>();
  const chosen = new Set<string>();
  for (const m of media ?? []) {
    if (chosen.has(m.content_id)) continue;
    if (m.is_selected) {
      cover.set(m.content_id, m.storage_path);
      chosen.add(m.content_id);
    } else if (!cover.has(m.content_id)) {
      cover.set(m.content_id, m.storage_path);
    }
  }

  const urls = await signPaths(supabase, [...cover.values()]);
  return contents.map((c) => ({ ...c, cover_url: urls.get(cover.get(c.id) ?? "") ?? null }));
}

export type TimelineItem =
  | { kind: "comment"; id: string; at: string; body: string; author: string; authorRole: string | null; mine: boolean }
  | {
      kind: "approval";
      id: string;
      at: string;
      decision: "aprovado" | "ajuste";
      comment: string | null;
      author: string;
      from: string | null;
      to: string | null;
    };

export async function loadContentDetail(supabase: SupabaseClient, id: string, me: string) {
  const { data: content } = await supabase.from("contents").select("*").eq("id", id).maybeSingle<Content>();
  if (!content) return null;

  const [{ data: client }, { data: titles }, { data: media }, { data: comments }, { data: approvals }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", content.client_id).single<Client>(),
    supabase.from("title_options").select("*").eq("content_id", id).order("created_at"),
    supabase.from("media").select("*").eq("content_id", id).order("sort_order").order("created_at"),
    supabase.from("comments").select("*").eq("content_id", id).order("created_at"),
    supabase.from("approvals").select("*").eq("content_id", id).order("created_at"),
  ]);

  const ids = [
    ...new Set([...(comments ?? []).map((c) => c.author_id), ...(approvals ?? []).map((a) => a.user_id)].filter(Boolean)),
  ] as string[];
  const { data: names } = ids.length ? await supabase.rpc("profile_names", { p_ids: ids }) : { data: [] };
  const nameOf = new Map<string, { full_name: string | null; role: string }>(
    ((names ?? []) as { id: string; full_name: string | null; role: string }[]).map((n) => [n.id, n]),
  );

  // Comentários feitos junto com uma decisão já aparecem no card da aprovação
  const approvalComments = new Set((approvals as Approval[] | null)?.map((a) => `${a.user_id}|${a.comment}`) ?? []);
  const timeline: TimelineItem[] = [
    ...((comments as Comment[] | null) ?? [])
      .filter((c) => !approvalComments.has(`${c.author_id}|${c.body}`))
      .map((c) => ({
        kind: "comment" as const,
        id: c.id,
        at: c.created_at,
        body: c.body,
        author: nameOf.get(c.author_id ?? "")?.full_name ?? "Alguém",
        authorRole: nameOf.get(c.author_id ?? "")?.role ?? null,
        mine: c.author_id === me,
      })),
    ...((approvals as Approval[] | null) ?? []).map((a) => ({
      kind: "approval" as const,
      id: a.id,
      at: a.created_at,
      decision: a.decision,
      comment: a.comment,
      author: nameOf.get(a.user_id ?? "")?.full_name ?? "Alguém",
      from: a.from_status,
      to: a.to_status,
    })),
  ].sort((a, b) => (a.at < b.at ? -1 : 1));

  return {
    content,
    client: client!,
    titles: (titles as TitleOption[]) ?? [],
    media: await withUrls(supabase, (media as Media[]) ?? []),
    timeline,
  };
}

export type ContentDetailData = NonNullable<Awaited<ReturnType<typeof loadContentDetail>>>;

export async function loadSuggestions(supabase: SupabaseClient, clientId?: string) {
  let q = supabase.from("suggestions").select("*, client:clients(name, color, slug)").order("created_at", { ascending: false });
  if (clientId) q = q.eq("client_id", clientId);
  const { data } = await q;
  const list = (data ?? []) as (Suggestion & { client: { name: string; color: string; slug: string } | null })[];
  const urls = await signPaths(
    supabase,
    list.map((s) => s.attachment_path ?? ""),
  );
  // ordem: novas, em análise, depois o resto
  const rank = { nova: 0, em_analise: 1, aceita: 2, recusada: 3 } as const;
  return list
    .map((s) => ({ ...s, attachment_url: s.attachment_path ? (urls.get(s.attachment_path) ?? null) : null }))
    .sort((a, b) => rank[a.status] - rank[b.status]);
}

/** Sequência de semanas "em dia": semanas consecutivas (até a passada) com tudo agendado/postado. */
export function computeStreak(contents: Pick<Content, "publish_date" | "status">[], weekKeyOf: (d: string) => string, currentWeek: string) {
  const byWeek = new Map<string, { total: number; done: number }>();
  for (const c of contents) {
    if (!c.publish_date) continue;
    const k = weekKeyOf(c.publish_date);
    if (k >= currentWeek) continue;
    const w = byWeek.get(k) ?? { total: 0, done: 0 };
    w.total++;
    if (c.status === "postado" || c.status === "agendado") w.done++;
    byWeek.set(k, w);
  }
  const weeks = [...byWeek.keys()].sort().reverse();
  let streak = 0;
  for (const k of weeks) {
    const w = byWeek.get(k)!;
    if (w.done === w.total) streak++;
    else break;
  }
  return streak;
}
