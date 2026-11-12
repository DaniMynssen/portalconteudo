import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Columns3, KeyRound, Lightbulb, List } from "lucide-react";
import { endOfMonth, format, parseISO } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { attachCovers, loadSuggestions } from "@/lib/data";
import { FORMATS, type Format } from "@/lib/pipelines";
import type { Client, Content, Profile } from "@/lib/types";
import { cn, todayISO } from "@/lib/utils";
import { Avatar, Chip } from "@/components/ui";
import { WeekList } from "@/components/week-list";
import { Kanban } from "@/components/kanban";
import { MonthCalendar } from "@/components/month-calendar";
import { NewContentButton } from "@/components/new-content";
import { SuggestionsAdmin } from "@/components/suggestions-admin";
import { AccessPanel } from "@/components/access-panel";
import { EmptyState } from "@/components/mascot";
import { PlatformIcon } from "@/components/platform";

type SP = { view?: string; plataforma?: string; formato?: string; mes?: string; todas?: string };

const VIEWS = [
  { key: "lista", label: "Lista", icon: List },
  { key: "kanban", label: "Kanban", icon: Columns3 },
  { key: "mes", label: "Mês", icon: CalendarDays },
  { key: "sugestoes", label: "Sugestões", icon: Lightbulb },
  { key: "acessos", label: "Acessos", icon: KeyRound },
];

export default async function ClientePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: client } = await supabase.from("clients").select("*").eq("slug", slug).single<Client>();
  if (!client) notFound();

  const view = sp.view ?? "lista";
  const platform = sp.plataforma === "youtube" || sp.plataforma === "instagram" ? sp.plataforma : null;
  const href = (patch: Partial<SP>) => {
    const next = { ...sp, ...patch };
    const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]);
    return `/clientes/${slug}?${qs}`;
  };

  const { count: newSuggestions } = await supabase
    .from("suggestions")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client.id)
    .eq("status", "nova");

  let body: React.ReactNode = null;

  if (view === "sugestoes") {
    body = <SuggestionsAdmin items={await loadSuggestions(supabase, client.id)} />;
  } else if (view === "acessos") {
    const { data: users } = await supabase.from("profiles").select("*").eq("client_id", client.id).order("created_at");
    body = <AccessPanel client={client} users={(users as Profile[]) ?? []} />;
  } else {
    let q = supabase.from("contents").select("*").eq("client_id", client.id);
    if (platform) q = q.eq("platform", platform);

    if (view === "mes") {
      const month = /^\d{4}-\d{2}$/.test(sp.mes ?? "") ? sp.mes! : format(new Date(), "yyyy-MM");
      q = q.gte("publish_date", `${month}-01`).lte("publish_date", format(endOfMonth(parseISO(`${month}-01`)), "yyyy-MM-dd"));
      const { data } = await q;
      const items = await attachCovers(supabase, (data as Content[]) ?? []);
      body = (
        <MonthCalendar items={items} month={month} hrefBase="/conteudos" navHref={(m) => href({ mes: m })} />
      );
    } else if (view === "kanban") {
      const { data } = await q.order("publish_date", { nullsFirst: false });
      const all = (data as Content[]) ?? [];
      const present = [...new Set(all.map((c) => c.format))] as Format[];
      const fmt = (sp.formato && sp.formato in FORMATS ? sp.formato : present[0] ?? "video") as Format;
      const items = await attachCovers(
        supabase,
        all.filter((c) => c.format === fmt && (c.status !== "postado" || (c.publish_date ?? "") >= todayISO().slice(0, 8) + "01")),
      );
      body = (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(FORMATS) as Format[])
              .filter((f) => !platform || FORMATS[f].platform === platform)
              .map((f) => (
                <Link
                  key={f}
                  href={href({ formato: f })}
                  className={cn(
                    "flex items-center gap-1.5 rounded-2xl border-2 border-b-4 px-3 py-1.5 text-sm font-extrabold",
                    f === fmt ? "border-blue bg-blue-soft text-blue-dark" : "border-border text-muted",
                  )}
                >
                  <PlatformIcon platform={FORMATS[f].platform} size={16} />
                  {FORMATS[f].label}
                  <span className="text-xs opacity-70">{all.filter((c) => c.format === f).length}</span>
                </Link>
              ))}
          </div>
          <Kanban items={items} format={fmt} />
        </>
      );
    } else {
      const showAll = sp.todas === "1";
      if (!showAll) {
        const since = format(new Date(Date.now() - 7 * 86400000), "yyyy-MM-dd");
        q = q.or(`publish_date.gte.${since},publish_date.is.null,status.neq.postado`);
      }
      const { data } = await q.order("publish_date", { nullsFirst: false });
      const items = await attachCovers(supabase, (data as Content[]) ?? []);
      body = (
        <>
          {items.length ? (
            <WeekList items={items} hrefBase="/conteudos" />
          ) : (
            <EmptyState title="Calendário vazio" mood="happy" action={<NewContentButton clientId={client.id} />}>
              Crie o primeiro conteúdo de {client.name}.
            </EmptyState>
          )}
          <div className="mt-8 text-center">
            <Link href={href({ todas: showAll ? undefined : "1" })} className="text-sm font-extrabold uppercase text-blue">
              {showAll ? "Mostrar só os próximos" : "Ver também os antigos"}
            </Link>
          </div>
        </>
      );
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={client.name} color={client.color} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-black sm:text-3xl">{client.name}</h1>
          <div className="mt-1 flex flex-wrap gap-3 text-sm font-bold text-muted">
            {client.youtube_url && (
              <a href={client.youtube_url.startsWith("http") ? client.youtube_url : `https://${client.youtube_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-ink">
                <PlatformIcon platform="youtube" size={16} /> YouTube
              </a>
            )}
            {client.instagram_handle && (
              <a href={`https://instagram.com/${client.instagram_handle}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-ink">
                <PlatformIcon platform="instagram" size={16} /> @{client.instagram_handle}
              </a>
            )}
          </div>
        </div>
        <NewContentButton clientId={client.id} />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-border">
        <nav className="no-scrollbar -mb-[2px] flex gap-1 overflow-x-auto">
          {VIEWS.map(({ key, label, icon: Icon }) => (
            <Link
              key={key}
              href={href({ view: key === "lista" ? undefined : key })}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap border-b-4 px-3 py-2.5 text-sm font-extrabold uppercase tracking-wide",
                view === key ? "border-blue text-blue" : "border-transparent text-muted hover:text-ink",
              )}
            >
              <Icon className="size-4" strokeWidth={3} />
              {label}
              {key === "sugestoes" && !!newSuggestions && <Chip tone="red">{newSuggestions}</Chip>}
            </Link>
          ))}
        </nav>
        {["lista", "kanban", "mes"].includes(view) && (
          <div className="mb-2 flex gap-1">
            {[
              { k: undefined, l: "Tudo" },
              { k: "youtube", l: "YouTube" },
              { k: "instagram", l: "Instagram" },
            ].map(({ k, l }) => (
              <Link
                key={l}
                href={href({ plataforma: k, formato: undefined })}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-extrabold uppercase",
                  (platform ?? undefined) === k ? "bg-ink text-bg" : "text-muted hover:bg-surface-2",
                )}
              >
                {l}
              </Link>
            ))}
          </div>
        )}
      </div>

      {body}
    </>
  );
}
