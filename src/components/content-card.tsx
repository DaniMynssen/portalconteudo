import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { FORMATS } from "@/lib/pipelines";
import type { ContentCard } from "@/lib/types";
import { PlatformIcon, StatusChip } from "./platform";
import { MiniTrail } from "./progress-trail";
import { Avatar } from "./ui";

export function Cover({ item, className }: { item: ContentCard; className?: string }) {
  const aspect = FORMATS[item.format].aspect;
  const tall = aspect === "9/16" || aspect === "4/5";
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl border-2 border-border bg-surface-2",
        tall ? "h-[68px] w-[54px]" : "h-[68px] w-[120px]",
        className,
      )}
    >
      {item.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.cover_url} alt="" className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center text-gray">
          <ImageIcon className="size-5" strokeWidth={2.5} />
        </div>
      )}
    </div>
  );
}

function DateBadge({ date }: { date: string | null }) {
  if (!date) {
    return (
      <div className="grid h-[60px] w-12 shrink-0 place-items-center rounded-xl border-2 border-dashed border-border text-[10px] font-extrabold uppercase text-muted">
        sem data
      </div>
    );
  }
  const d = parseISO(date);
  return (
    <div className="flex h-[60px] w-12 shrink-0 flex-col overflow-hidden rounded-xl border-2 border-border text-center">
      <div className="bg-red py-0.5 text-[10px] font-extrabold uppercase text-white">
        {format(d, "EEE", { locale: ptBR }).replace(".", "")}
      </div>
      <div className="grid flex-1 place-items-center text-xl font-black leading-none">{format(d, "dd")}</div>
    </div>
  );
}

export function ContentRow({ item, href, showClient }: { item: ContentCard; href: string; showClient?: boolean }) {
  const awaiting = item.status === "aprovacao";
  return (
    <Link
      href={href}
      className={cn("card-pop flex items-center gap-3 p-3 sm:gap-4", awaiting && "border-yellow")}
    >
      <DateBadge date={item.publish_date} />
      <Cover item={item} className="hidden sm:block" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <PlatformIcon platform={item.platform} size={20} />
          <span className="text-xs font-extrabold uppercase tracking-wide text-muted">{FORMATS[item.format].label}</span>
          {showClient && item.client && (
            <span className="flex items-center gap-1 text-xs font-bold text-muted">
              · <Avatar name={item.client.name} color={item.client.color} size={16} /> {item.client.name}
            </span>
          )}
        </div>
        <p className={cn("truncate text-[15px] font-extrabold", !item.title && "italic text-muted")}>
          {item.title || "Sem título ainda"}
        </p>
        <MiniTrail format={item.format} status={item.status} className="mt-2 sm:hidden" />
      </div>
      <div className="hidden flex-col items-end gap-2 sm:flex">
        <StatusChip status={item.status} />
        <MiniTrail format={item.format} status={item.status} />
      </div>
      <StatusChip status={item.status} className="sm:hidden" />
    </Link>
  );
}
