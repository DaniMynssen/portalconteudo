"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export function PortalTabs() {
  const path = usePathname();
  const items = [
    { href: "/portal", label: "Conteúdos", icon: CalendarDays, active: path === "/portal" || path.startsWith("/portal/conteudos") },
    { href: "/portal/sugestoes", label: "Minhas ideias", icon: Lightbulb, active: path.startsWith("/portal/sugestoes") },
  ];
  return (
    <nav className="mx-auto flex max-w-4xl gap-1 px-4 sm:px-6">
      {items.map(({ href, label, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "-mb-[2px] flex items-center gap-1.5 border-b-4 px-3 py-2.5 text-sm font-extrabold uppercase tracking-wide",
            active ? "border-blue text-blue" : "border-transparent text-muted hover:text-ink",
          )}
        >
          <Icon className="size-4" strokeWidth={3} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function SuggestFab() {
  const path = usePathname();
  if (path.startsWith("/portal/sugestoes")) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[calc(1rem+env(safe-area-inset-bottom))] sm:justify-end sm:pr-8">
      <Link
        href="/portal/sugestoes?nova=1"
        className="btn3d pointer-events-auto h-14 px-6 text-base"
        style={{ ["--c" as string]: "var(--orange)", ["--c-dark" as string]: "var(--orange-dark)" }}
      >
        <Lightbulb className="size-5" strokeWidth={3} /> Sugerir ideia
      </Link>
    </div>
  );
}
