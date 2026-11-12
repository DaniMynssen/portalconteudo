import * as React from "react";
import Link from "next/link";
import { cn, initials } from "@/lib/utils";
import type { Tone } from "@/lib/pipelines";

/* ---------- Cores por tom (classes estáticas para o Tailwind) ---------- */

export const TONE: Record<Tone, { bg: string; soft: string; text: string; border: string; vars: React.CSSProperties }> = {
  green: { bg: "bg-green", soft: "bg-green-soft", text: "text-green-dark", border: "border-green", vars: { "--c": "var(--green)", "--c-dark": "var(--green-dark)" } as React.CSSProperties },
  blue: { bg: "bg-blue", soft: "bg-blue-soft", text: "text-blue-dark", border: "border-blue", vars: { "--c": "var(--blue)", "--c-dark": "var(--blue-dark)" } as React.CSSProperties },
  purple: { bg: "bg-purple", soft: "bg-purple-soft", text: "text-purple-dark", border: "border-purple", vars: { "--c": "var(--purple)", "--c-dark": "var(--purple-dark)" } as React.CSSProperties },
  orange: { bg: "bg-orange", soft: "bg-orange-soft", text: "text-orange-dark", border: "border-orange", vars: { "--c": "var(--orange)", "--c-dark": "var(--orange-dark)" } as React.CSSProperties },
  pink: { bg: "bg-pink", soft: "bg-pink-soft", text: "text-pink-dark", border: "border-pink", vars: { "--c": "var(--pink)", "--c-dark": "var(--pink-dark)" } as React.CSSProperties },
  yellow: { bg: "bg-yellow", soft: "bg-yellow-soft", text: "text-yellow-dark", border: "border-yellow", vars: { "--c": "var(--yellow)", "--c-dark": "var(--yellow-dark)" } as React.CSSProperties },
  red: { bg: "bg-red", soft: "bg-red-soft", text: "text-red-dark", border: "border-red", vars: { "--c": "var(--red)", "--c-dark": "var(--red-dark)" } as React.CSSProperties },
  gray: { bg: "bg-gray", soft: "bg-gray-soft", text: "text-muted", border: "border-gray", vars: { "--c": "var(--gray)", "--c-dark": "var(--gray-dark)" } as React.CSSProperties },
};

export const CLIENT_COLORS: Tone[] = ["green", "blue", "purple", "orange", "pink", "yellow", "red"];

export function toneOf(color: string | null | undefined): Tone {
  return (color && color in TONE ? color : "green") as Tone;
}

/* ---------- Botão 3D ---------- */

type BtnProps = {
  tone?: Tone;
  variant?: "solid" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
};

const SIZES = {
  sm: "h-9 px-3.5 text-xs rounded-xl",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base",
};

export function Button({
  tone = "green",
  variant = "solid",
  size = "md",
  className,
  children,
  ...rest
}: BtnProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      data-variant={variant === "ghost" ? "ghost" : undefined}
      style={variant === "solid" ? TONE[tone].vars : undefined}
      className={cn("btn3d", SIZES[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  tone = "green",
  variant = "solid",
  size = "md",
  className,
  children,
}: BtnProps & { href: string }) {
  return (
    <Link
      href={href}
      data-variant={variant === "ghost" ? "ghost" : undefined}
      style={variant === "solid" ? TONE[tone].vars : undefined}
      className={cn("btn3d", SIZES[size], className)}
    >
      {children}
    </Link>
  );
}

/* ---------- Chip ---------- */

export function Chip({ tone = "gray", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide",
        TONE[tone].soft,
        TONE[tone].text,
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------- Barra de progresso ---------- */

export function ProgressBar({ value, tone = "green", className }: { value: number; tone?: Tone; className?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={cn("h-4 w-full overflow-hidden rounded-full bg-gray-soft", className)}>
      <div
        className={cn("relative h-full rounded-full transition-[width] duration-700 ease-out", TONE[tone].bg)}
        style={{ width: `${pct}%`, minWidth: pct > 0 ? "1rem" : 0 }}
      >
        <div className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/35" />
      </div>
    </div>
  );
}

/* ---------- Avatar do cliente ---------- */

export function Avatar({
  name,
  color,
  size = 40,
  className,
}: {
  name: string;
  color?: string | null;
  size?: number;
  className?: string;
}) {
  const tone = toneOf(color);
  return (
    <div
      className={cn("grid shrink-0 place-items-center rounded-full font-black text-white", TONE[tone].bg, className)}
      style={{ width: size, height: size, fontSize: size * 0.38, boxShadow: `inset 0 -${Math.max(2, size / 14)}px 0 rgba(0,0,0,.18)` }}
    >
      {initials(name)}
    </div>
  );
}

/* ---------- Título de seção ---------- */

export function SectionTitle({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="text-xl font-black tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

export function Label({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <span className="text-xs font-extrabold uppercase tracking-wider text-muted">{children}</span>
      {hint && <span className="text-xs font-bold text-muted">{hint}</span>}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: React.ReactNode; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
