import { cn } from "@/lib/utils";
import { FORMATS, STATUS, type Format, type Platform, type StatusKey } from "@/lib/pipelines";
import { Chip } from "./ui";

export function PlatformIcon({ platform, size = 28, className }: { platform: Platform; size?: number; className?: string }) {
  if (platform === "youtube") {
    return (
      <span
        className={cn("grid shrink-0 place-items-center rounded-[30%] bg-youtube", className)}
        style={{ width: size, height: size, boxShadow: "inset 0 -3px 0 rgba(0,0,0,.18)" }}
        title="YouTube"
      >
        <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="#fff" aria-hidden>
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-[30%]", className)}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(45deg,#ffb000 0%,#ff3d6e 45%,#c13584 70%,#7c3aed 100%)",
        boxShadow: "inset 0 -3px 0 rgba(0,0,0,.18)",
      }}
      title="Instagram"
    >
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none" stroke="#fff" strokeWidth="2.4" aria-hidden>
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <circle cx="12" cy="12" r="3.6" />
        <circle cx="17" cy="7" r="1" fill="#fff" stroke="none" />
      </svg>
    </span>
  );
}

export function FormatTag({ format }: { format: Format }) {
  return <span className="text-xs font-extrabold uppercase tracking-wide text-muted">{FORMATS[format].label}</span>;
}

export function StatusChip({ status, className }: { status: string; className?: string }) {
  const s = STATUS[status as StatusKey] ?? { label: status, tone: "gray" as const };
  return (
    <Chip tone={s.tone} className={className}>
      {s.label}
    </Chip>
  );
}
