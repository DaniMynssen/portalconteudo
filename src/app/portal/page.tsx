import Link from "next/link";
import { Flame } from "lucide-react";
import { endOfISOWeek, format, startOfISOWeek } from "date-fns";
import { requireClient } from "@/lib/auth";
import { attachCovers, computeStreak } from "@/lib/data";
import { FORMATS, isDone } from "@/lib/pipelines";
import type { Content } from "@/lib/types";
import { todayISO, weekKey } from "@/lib/utils";
import { WeekList } from "@/components/week-list";
import { Cover } from "@/components/content-card";
import { PlatformIcon } from "@/components/platform";
import { ProgressBar, SectionTitle } from "@/components/ui";
import { EmptyState, Mascot } from "@/components/mascot";

export default async function Portal({ searchParams }: { searchParams: Promise<{ todas?: string }> }) {
  const sp = await searchParams;
  const { supabase, client, profile } = await requireClient();
  const showAll = sp.todas === "1";

  const { data } = await supabase
    .from("contents")
    .select("*")
    .eq("client_id", client.id)
    .order("publish_date", { nullsFirst: false });
  const all = (data as Content[]) ?? [];

  const since = format(new Date(Date.now() - 7 * 86400000), "yyyy-MM-dd");
  const visible = showAll ? all : all.filter((c) => !c.publish_date || c.publish_date >= since || c.status !== "postado");
  const cards = await attachCovers(supabase, visible);
  const pending = cards.filter((c) => c.status === "aprovacao");

  const ws = format(startOfISOWeek(new Date()), "yyyy-MM-dd");
  const we = format(endOfISOWeek(new Date()), "yyyy-MM-dd");
  const thisWeek = all.filter((c) => c.publish_date && c.publish_date >= ws && c.publish_date <= we);
  const weekDone = thisWeek.filter((c) => isDone(c.status)).length;
  const streak = computeStreak(all, weekKey, weekKey(todayISO()));
  const firstName = profile.full_name?.split(" ")[0];

  return (
    <>
      {/* Boas-vindas */}
      <div className="mb-8 flex items-center gap-4">
        <Mascot mood={pending.length ? "waiting" : "happy"} size={84} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black sm:text-3xl">Oi{firstName ? `, ${firstName}` : ""}!</h1>
          <p className="font-bold text-muted">
            {pending.length
              ? `Tem ${pending.length} ${pending.length === 1 ? "coisa esperando" : "coisas esperando"} sua aprovação.`
              : "Tudo em dia por aqui. Olha o que vem por aí:"}
          </p>
        </div>
      </div>

      <div className="mb-10 grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <p className="text-xs font-extrabold uppercase text-muted">Esta semana</p>
          <p className="mb-2 text-xl font-black">
            {thisWeek.length ? `${weekDone} de ${thisWeek.length} prontos` : "Nada programado"}
          </p>
          <ProgressBar value={thisWeek.length ? weekDone / thisWeek.length : 0} />
        </div>
        <div className="card flex items-center gap-4 p-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-orange-soft">
            <Flame className="size-8 text-orange" strokeWidth={2.5} fill={streak ? "currentColor" : "none"} />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase text-muted">Sequência</p>
            <p className="text-xl font-black">
              {streak} {streak === 1 ? "semana" : "semanas"} em dia
            </p>
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <section className="mb-10">
          <SectionTitle>Aguardando você</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {pending.map((c) => (
              <Link key={c.id} href={`/portal/conteudos/${c.id}`} className="card-pop flex items-center gap-3 border-yellow bg-yellow-soft p-3">
                <Cover item={c} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-1.5">
                    <PlatformIcon platform={c.platform} size={18} />
                    <span className="text-xs font-extrabold uppercase text-muted">{FORMATS[c.format].label}</span>
                  </div>
                  <p className="line-clamp-2 font-extrabold">{c.title || "Sem título"}</p>
                  <p className="mt-1 text-xs font-extrabold uppercase text-yellow-dark">Toque para aprovar →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SectionTitle>Próximos conteúdos</SectionTitle>
      {cards.length ? (
        <WeekList items={cards} hrefBase="/portal/conteudos" />
      ) : (
        <EmptyState title="Ainda não tem nada aqui" mood="sleepy">
          Assim que o calendário for montado, os conteúdos aparecem aqui. Enquanto isso, que tal sugerir uma ideia?
        </EmptyState>
      )}
      {all.length > visible.length || showAll ? (
        <div className="mt-8 text-center">
          <Link href={showAll ? "/portal" : "/portal?todas=1"} className="text-sm font-extrabold uppercase text-blue">
            {showAll ? "Mostrar só os próximos" : "Ver também os já publicados"}
          </Link>
        </div>
      ) : null}
    </>
  );
}
