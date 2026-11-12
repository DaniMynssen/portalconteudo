"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth";
import { coerceStatus, FORMATS, type Format, type StatusKey } from "@/lib/pipelines";
import type { Content, ContentMetadata } from "@/lib/types";

function revalidateContent(id?: string) {
  revalidatePath("/", "layout");
  if (id) {
    revalidatePath(`/conteudos/${id}`);
    revalidatePath(`/portal/conteudos/${id}`);
  }
}

export async function createContent(clientId: string, format: Format, publishDate?: string | null, fromSuggestion?: string) {
  const { supabase } = await requireAdmin();
  let title = "";
  let briefing = "";
  if (fromSuggestion) {
    const { data: s } = await supabase.from("suggestions").select("*").eq("id", fromSuggestion).single();
    if (s) {
      title = s.title;
      briefing = [s.description, s.reference_url ? `Referência: ${s.reference_url}` : ""].filter(Boolean).join("\n\n");
    }
  }
  const { data, error } = await supabase
    .from("contents")
    .insert({
      client_id: clientId,
      platform: FORMATS[format].platform,
      format,
      status: "ideia",
      publish_date: publishDate || null,
      title,
      briefing,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (fromSuggestion) {
    await supabase.from("suggestions").update({ status: "aceita", content_id: data.id }).eq("id", fromSuggestion);
  }
  revalidateContent();
  redirect(`/conteudos/${data.id}`);
}

type Patch = Partial<
  Pick<Content, "title" | "briefing" | "script" | "notes" | "publish_date" | "post_url" | "status" | "format">
> & { metadata?: ContentMetadata };

export async function updateContent(id: string, patch: Patch) {
  const { supabase } = await requireAdmin();
  const update: Record<string, unknown> = { ...patch };

  if (patch.format) {
    update.platform = FORMATS[patch.format].platform;
    const { data: cur } = await supabase.from("contents").select("status").eq("id", id).single();
    update.status = coerceStatus(patch.format, patch.status ?? cur?.status ?? "ideia");
  }
  if (patch.metadata) {
    const { data: cur } = await supabase.from("contents").select("metadata").eq("id", id).single();
    update.metadata = { ...(cur?.metadata ?? {}), ...patch.metadata };
  }
  const { error } = await supabase.from("contents").update(update).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidateContent(id);
  return { ok: true };
}

export async function moveStatus(id: string, status: StatusKey) {
  return updateContent(id, { status });
}

export async function deleteContent(id: string, clientSlug: string) {
  const { supabase } = await requireAdmin();
  const { data: media } = await supabase.from("media").select("storage_path").eq("content_id", id);
  if (media?.length) await supabase.storage.from("media").remove(media.map((m) => m.storage_path));
  const { error } = await supabase.from("contents").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateContent();
  redirect(`/clientes/${clientSlug}`);
}

/* ---------------- Títulos ---------------- */

export async function addTitleOption(contentId: string, text: string) {
  const { supabase } = await requireAdmin();
  if (!text.trim()) return;
  const { count } = await supabase
    .from("title_options")
    .select("id", { count: "exact", head: true })
    .eq("content_id", contentId);
  await supabase.from("title_options").insert({ content_id: contentId, text: text.trim(), is_selected: !count });
  if (!count) await supabase.from("contents").update({ title: text.trim() }).eq("id", contentId);
  revalidateContent(contentId);
}

export async function selectTitleOption(contentId: string, optionId: string) {
  const { supabase } = await requireAdmin();
  const { data: opt } = await supabase.from("title_options").select("text").eq("id", optionId).single();
  await supabase.from("title_options").update({ is_selected: false }).eq("content_id", contentId);
  await supabase.from("title_options").update({ is_selected: true }).eq("id", optionId);
  if (opt) await supabase.from("contents").update({ title: opt.text }).eq("id", contentId);
  revalidateContent(contentId);
}

export async function deleteTitleOption(contentId: string, optionId: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("title_options").delete().eq("id", optionId);
  revalidateContent(contentId);
}

/* ---------------- Mídias ---------------- */

export async function registerMedia(contentId: string, items: { path: string; name: string }[]) {
  const { supabase } = await requireAdmin();
  const { data: content } = await supabase.from("contents").select("format, client_id").eq("id", contentId).single();
  if (!content) throw new Error("Conteúdo não encontrado");
  const kind = FORMATS[content.format as Format].media;
  const { count } = await supabase.from("media").select("id", { count: "exact", head: true }).eq("content_id", contentId);
  const base = count ?? 0;
  const rows = items
    .filter((it) => it.path.startsWith(`${content.client_id}/${contentId}/`))
    .map((it, i) => ({
      content_id: contentId,
      kind,
      storage_path: it.path,
      file_name: it.name,
      sort_order: base + i,
      is_selected: base === 0 && i === 0 && kind !== "slide",
    }));
  if (rows.length) await supabase.from("media").insert(rows);
  revalidateContent(contentId);
}

export async function selectMedia(contentId: string, mediaId: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("media").update({ is_selected: false }).eq("content_id", contentId);
  await supabase.from("media").update({ is_selected: true }).eq("id", mediaId);
  revalidateContent(contentId);
}

export async function moveMedia(contentId: string, mediaId: string, dir: -1 | 1) {
  const { supabase } = await requireAdmin();
  const { data: list } = await supabase
    .from("media")
    .select("id, sort_order")
    .eq("content_id", contentId)
    .order("sort_order")
    .order("created_at");
  if (!list) return;
  const i = list.findIndex((m) => m.id === mediaId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j]!, list[i]!];
  await Promise.all(list.map((m, idx) => supabase.from("media").update({ sort_order: idx }).eq("id", m.id)));
  revalidateContent(contentId);
}

export async function deleteMedia(contentId: string, mediaId: string) {
  const { supabase } = await requireAdmin();
  const { data: m } = await supabase.from("media").select("storage_path").eq("id", mediaId).single();
  if (m) await supabase.storage.from("media").remove([m.storage_path]);
  await supabase.from("media").delete().eq("id", mediaId);
  revalidateContent(contentId);
}

/* ---------------- Ações do cliente (e admin) ---------------- */

export async function decideApproval(contentId: string, decision: "aprovado" | "ajuste", comment?: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("decide_approval", {
    p_content_id: contentId,
    p_decision: decision,
    p_comment: comment ?? null,
  });
  if (error) return { ok: false, message: error.message };
  revalidateContent(contentId);
  return { ok: true, status: data as string };
}

export async function pickMedia(contentId: string, mediaId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("client_pick_media", { p_media_id: mediaId });
  if (error) return { ok: false, message: error.message };
  revalidateContent(contentId);
  return { ok: true };
}

export async function pickTitle(contentId: string, titleId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("client_pick_title", { p_title_id: titleId });
  if (error) return { ok: false, message: error.message };
  revalidateContent(contentId);
  return { ok: true };
}

export async function addComment(target: { contentId?: string; suggestionId?: string }, body: string) {
  const { supabase, user } = await requireUser();
  if (!body.trim()) return { ok: false, message: "Escreva algo" };
  const { error } = await supabase.from("comments").insert({
    content_id: target.contentId ?? null,
    suggestion_id: target.suggestionId ?? null,
    author_id: user!.id,
    body: body.trim(),
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
