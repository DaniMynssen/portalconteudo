import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { STATUS, type StatusKey } from "@/lib/pipelines";
import type { ContentCard } from "@/lib/types";
import { PlatformIcon } from "./platform";
import { TONE } from "./ui";

export function MonthCalendar({
  items,
  month,
  hrefBase,
  navHref,
}: {
  items: ContentCard[];
  month: string; // yyyy-MM
  hrefBase: string;
  navHref: (month: string) => string;
}) {
  const first = parseISO(`${month}-01`);
  const start = startOfWeek(startOfMonth(first), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(first), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  const byDay = new Map<string, ContentCard[]>();
  for (const it of items) {
    if (!it.publish_date) continue;
    byDay.set(it.publish_date, [...(byDay.get(it.publish_date) ?? []), it]);
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Link href={navHref(format(addMonths(first, -1), "yyyy-MM"))} className="btn3d h-10 w-10 !px-0" data-variant="ghost" aria-label="Mês anterior">
          <ChevronLeft strokeWidth={3} className="size-5" />
        </Link>
        <h3 className="min-w-44 text-center text-lg font-black capitalize">{format(first, "MMMM yyyy", { locale: ptBR })}</h3>
        <Link href={navHref(format(addMonths(first, 1), "yyyy-MM"))} className="btn3d h-10 w-10 !px-0" data-variant="ghost" aria-label="Próximo mês">
          <ChevronRight strokeWidth={3} className="size-5" />
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b-2 border-border bg-surface-2">
          {["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-extrabold uppercase text-muted">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const list = byDay.get(key) ?? [];
            const inMonth = isSameMonth(d, first);
            return (
              <div
                key={key}
                className={cn(
                  "min-h-20 border-b-2 border-r-2 border-border p-1 sm:min-h-28 sm:p-1.5 [&:nth-child(7n)]:border-r-0",
                  !inMonth && "bg-surface-2/60",
                )}
              >
                <div
                  className={cn(
                    "mb-1 grid size-6 place-items-center rounded-full text-xs font-black",
                    isToday(d) ? "bg-blue text-white" : inMonth ? "" : "text-muted",
                  )}
                >
                  {format(d, "d")}
                </div>
                <div className="space-y-1">
                  {list.map((it) => {
                    const tone = STATUS[it.status as StatusKey]?.tone ?? "gray";
                    return (
                      <Link
                        key={it.id}
                        href={`${hrefBase}/${it.id}`}
                        className={cn("flex items-center gap-1 rounded-lg px-1 py-0.5 text-[11px] font-extrabold leading-tight hover:brightness-95", TONE[tone].soft)}
                        title={it.title}
                      >
                        <PlatformIcon platform={it.platform} size={14} className="hidden sm:grid" />
                        <span className="line-clamp-2">{it.title || "Sem título"}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
