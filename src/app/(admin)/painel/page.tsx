import Link from "next/link";
import { CalendarCheck, Flame, Hourglass, Lightbulb } from "lucide-react";
import { endOfISOWeek, format, startOfISOWeek } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { attachCovers } from "@/lib/data";
import { isDone } from "@/lib/pipelines";
import type { Client, Content, Suggestion } from "@/lib/types";
import { ContentRow } from "@/components/content-card";
import { Avatar, Chip, PageHeader, ProgressBar, SectionTitle } from "@/components/ui";
import { EmptyState, Mascot } from "@/components/mascot";
import { timeAgo } from "@/lib/utils";

export default async function Painel() {
  const { supabase, profile } = await requireAdmin();
  const now = new Date();
  const ws = format(startOfISOWeek(now), "yyyy-MM-dd");
  const we = format(endOfISOWeek(now), "yyyy-MM-dd");

  const [{ data: clients }, { data: week }, { data: pending }, { data: suggestions }] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("contents").select("*").gte("publish_date", ws).lte("publish_date", we).order("publish_date"),
    supabase.from("contents").select("*").eq("status", "aprovacao").order("publish_date", { nullsFirst: false }),
    supabase.from("suggestions").select("*").eq("status", "nova").order("created_at", { ascending: false }).limit(5),
  ]);

  const clientMap = new Map((clients as Client[] | null)?.map((c) => [c.id, c]) ?? []);
  const withClient = <T extends Content>(list: T[]) =>
    list.map((c) => ({ ...c, client: clientMap.get(c.client_id) ?? null }));

  const weekCards = withClient(await attachCovers(supabase, (week as Content[]) ?? []));
  const pendingCards = withClient(await attachCovers(supabase, (pending as Content[]) ?? []));
  const done = weekCards.filter((c) => isDone(c.status)).length;
  const firstName = profile.full_name?.split(" ")[0] ?? "";

  return (
    <>
      <PageHeader title={`Oi${firstName ? `, ${firstName}` : ""}!`} subtitle="Aqui está o que rola nesta semana." />

      {/* Resumo */}
      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-green-soft">
            <CalendarCheck className="size-7 text-green" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase text-muted">Semana</p>
            <p className="text-xl font-black">
              {done} de {weekCards.length} prontos
            </p>
            <ProgressBar value={weekCards.length ? done / weekCards.length : 0} className="mt-1.5 h-2.5" />
          </div>
        </div>
        <div className="card flex items-center gap-4 p-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-yellow-soft">
            <Hourglass className="size-7 text-yellow-dark" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase text-muted">Com o cliente</p>
            <p className="text-xl font-black">{pendingCards.length} aguardando</p>
          </div>
        </div>
        <Link href="/sugestoes" className="card-pop flex items-center gap-4 p-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-orange-soft">
            <Lightbulb className="size-7 text-orange" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase text-muted">Ideias novas</p>
            <p className="text-xl font-black">{suggestions?.length ?? 0} sugestões</p>
          </div>
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          <section>
            <SectionTitle>Esta semana</SectionTitle>
            {weekCards.length ? (
              <div className="space-y-2.5">
                {weekCards.map((c) => (
                  <ContentRow key={c.id} item={c} href={`/conteudos/${c.id}`} showClient />
                ))}
              </div>
            ) : (
              <EmptyState title="Semana tranquila">Nenhum conteúdo com data para esta semana.</EmptyState>
            )}
          </section>

          <section>
            <SectionTitle>Aguardando aprovação</SectionTitle>
            {pendingCards.length ? (
              <div className="space-y-2.5">
                {pendingCards.map((c) => (
                  <ContentRow key={c.id} item={c} href={`/conteudos/${c.id}`} showClient />
                ))}
              </div>
            ) : (
              <div className="card flex items-center gap-4 p-5">
                <Mascot mood="happy" size={64} />
                <p className="text-muted">Nada parado com os clientes. Tudo fluindo!</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-10">
          <section>
            <SectionTitle>Clientes</SectionTitle>
            <div className="space-y-2">
              {(clients as Client[] | null)?.map((c) => {
                const n = weekCards.filter((w) => w.client_id === c.id);
                return (
                  <Link key={c.id} href={`/clientes/${c.slug}`} className="card-pop flex items-center gap-3 p-3">
                    <Avatar name={c.name} color={c.color} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-extrabold">{c.name}</p>
                      <p className="text-xs font-bold text-muted">
                        {n.length ? `${n.filter((x) => isDone(x.status)).length}/${n.length} nesta semana` : "nada nesta semana"}
                      </p>
                    </div>
                    {n.length > 0 && n.every((x) => isDone(x.status)) && <Flame className="size-5 text-orange" strokeWidth={2.5} />}
                  </Link>
                );
              })}
            </div>
          </section>

          {!!suggestions?.length && (
            <section>
              <SectionTitle>Sugestões novas</SectionTitle>
              <div className="space-y-2">
                {(suggestions as Suggestion[]).map((s) => (
                  <Link key={s.id} href="/sugestoes" className="card-pop block p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Chip tone="orange">{clientMap.get(s.client_id)?.name ?? "Cliente"}</Chip>
                      <span className="text-xs font-bold text-muted">{timeAgo(s.created_at)}</span>
                    </div>
                    <p className="font-extrabold">{s.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
