"use client";

import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINES, STATUS, type Format } from "@/lib/pipelines";
import { TONE } from "./ui";

/** Trilha completa: bolinhas conectadas com rótulos. Se onSelect existir, cada etapa é clicável. */
export function ProgressTrail({
  format,
  status,
  onSelect,
  disabled,
}: {
  format: Format;
  status: string;
  onSelect?: (step: string) => void;
  disabled?: boolean;
}) {
  const steps = PIPELINES[format];
  const current = steps.indexOf(status as never);

  return (
    <div className="no-scrollbar -mx-1 overflow-x-auto px-1 pb-1">
      <ol className="flex min-w-max items-start">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const meta = STATUS[step];
          const tone = active ? meta.tone : done ? "green" : "gray";
          const clickable = !!onSelect && !disabled;
          return (
            <li key={step} className="flex items-start">
              {i > 0 && (
                <div className={cn("mt-[22px] h-1.5 w-6 rounded-full sm:w-10", i <= current ? "bg-green" : "bg-gray-soft")} />
              )}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onSelect?.(step)}
                className={cn("group flex w-[76px] flex-col items-center gap-1.5", clickable ? "cursor-pointer" : "cursor-default")}
                title={clickable ? `Mover para ${meta.label}` : meta.label}
              >
                <span
                  className={cn(
                    "grid size-12 place-items-center rounded-full text-white transition-transform",
                    done || active ? TONE[tone].bg : "bg-gray-soft",
                    active && "pulse-ring scale-110",
                    clickable && "group-hover:scale-110",
                  )}
                  style={{
                    boxShadow: done || active ? "inset 0 -4px 0 rgba(0,0,0,.2)" : "inset 0 -4px 0 rgba(0,0,0,.06)",
                    ["--ring" as string]: `var(--${tone})`,
                  }}
                >
                  {done ? (
                    <Check strokeWidth={4} className="size-5" />
                  ) : active ? (
                    <span className="text-sm font-black">{i + 1}</span>
                  ) : (
                    <Lock strokeWidth={3} className="size-4 text-gray" />
                  )}
                </span>
                <span
                  className={cn(
                    "text-center text-[11px] font-extrabold leading-tight",
                    active ? TONE[tone].text : done ? "text-ink" : "text-muted",
                  )}
                >
                  {meta.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Trilha compacta para cards e listas. */
export function MiniTrail({ format, status, className }: { format: Format; status: string; className?: string }) {
  const steps = PIPELINES[format];
  const current = steps.indexOf(status as never);
  return (
    <div className={cn("flex items-center gap-1", className)} title={STATUS[status as never]?.["label"]}>
      {steps.map((s, i) => (
        <span
          key={s}
          className={cn(
            "h-2 rounded-full transition-all",
            i < current ? "w-2 bg-green" : i === current ? cn("w-5", TONE[STATUS[s].tone].bg) : "w-2 bg-gray-soft",
          )}
        />
      ))}
    </div>
  );
}
