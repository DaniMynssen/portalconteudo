import { isDone } from "@/lib/pipelines";
import type { ContentCard } from "@/lib/types";
import { weekKey, weekLabel, todayISO } from "@/lib/utils";
import { ContentRow } from "./content-card";
import { Chip, ProgressBar } from "./ui";

export function WeekList({
  items,
  hrefBase,
  showClient,
}: {
  items: ContentCard[];
  hrefBase: string;
  showClient?: boolean;
}) {
  const current = weekKey(todayISO());
  const groups = new Map<string, ContentCard[]>();
  const undated: ContentCard[] = [];
  for (const it of items) {
    if (!it.publish_date) undated.push(it);
    else {
      const k = weekKey(it.publish_date);
      groups.set(k, [...(groups.get(k) ?? []), it]);
    }
  }
  const keys = [...groups.keys()].sort();

  return (
    <div className="space-y-8">
      {keys.map((k) => {
        const list = groups.get(k)!.sort((a, b) => (a.publish_date! < b.publish_date! ? -1 : 1));
        const { number, range } = weekLabel(list[0]!.publish_date!);
        const done = list.filter((i) => isDone(i.status)).length;
        const isCurrent = k === current;
        const past = k < current;
        return (
          <section key={k}>
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h3 className="text-lg font-black">Semana {number}</h3>
              <span className="text-sm font-bold text-muted">{range}</span>
              {isCurrent && <Chip tone="blue">Esta semana</Chip>}
              {past && done === list.length && <Chip tone="green">Concluída</Chip>}
              <div className="ml-auto flex w-full items-center gap-2 sm:w-48">
                <ProgressBar value={done / list.length} className="h-3" tone={done === list.length ? "green" : "yellow"} />
                <span className="shrink-0 text-xs font-extrabold text-muted">
                  {done}/{list.length}
                </span>
              </div>
            </div>
            <div className="space-y-2.5">
              {list.map((it) => (
                <ContentRow key={it.id} item={it} href={`${hrefBase}/${it.id}`} showClient={showClient} />
              ))}
            </div>
          </section>
        );
      })}

      {undated.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-lg font-black">Banco de ideias</h3>
            <span className="text-sm font-bold text-muted">sem data definida</span>
          </div>
          <div className="space-y-2.5">
            {undated.map((it) => (
              <ContentRow key={it.id} item={it} href={`${hrefBase}/${it.id}`} showClient={showClient} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
