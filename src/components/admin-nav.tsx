"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Lightbulb, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";

const ITEMS = [
  { href: "/painel", label: "Painel", icon: Home, tone: "text-green" },
  { href: "/clientes", label: "Clientes", icon: Users, tone: "text-blue" },
  { href: "/sugestoes", label: "Sugestões", icon: Lightbulb, tone: "text-orange" },
];

export function AdminNav({ newSuggestions }: { newSuggestions: number }) {
  const path = usePathname();
  const isActive = (href: string) =>
    path === href || path.startsWith(href + "/") || (href === "/clientes" && path.startsWith("/conteudos"));

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r-2 border-border px-4 py-6 lg:flex">
        <Link href="/painel" className="mb-8 px-3 text-3xl font-black tracking-tight">
          pauta<span className="text-green">.</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1.5">
          {ITEMS.map(({ href, label, icon: Icon, tone }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-sm font-extrabold uppercase tracking-wide transition-colors",
                  active ? "border-blue bg-blue-soft text-blue-dark" : "border-transparent text-muted hover:bg-surface-2",
                )}
              >
                <Icon className={cn("size-6", tone)} strokeWidth={2.5} />
                <span className="flex-1">{label}</span>
                {href === "/sugestoes" && newSuggestions > 0 && (
                  <span className="grid min-w-6 place-items-center rounded-full bg-red px-1.5 text-xs text-white">
                    {newSuggestions}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <form action={signOut}>
          <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-extrabold uppercase tracking-wide text-muted hover:bg-surface-2">
            <LogOut className="size-5" strokeWidth={2.5} /> Sair
          </button>
        </form>
      </aside>

      {/* Mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t-2 border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {ITEMS.map(({ href, label, icon: Icon, tone }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5">
              <span className={cn("rounded-xl border-2 p-1.5", active ? "border-blue bg-blue-soft" : "border-transparent")}>
                <Icon className={cn("size-6", tone)} strokeWidth={2.5} />
              </span>
              <span className={cn("text-[10px] font-extrabold uppercase", active ? "text-blue-dark" : "text-muted")}>{label}</span>
              {href === "/sugestoes" && newSuggestions > 0 && (
                <span className="absolute right-[calc(50%-22px)] top-1.5 grid min-w-5 place-items-center rounded-full bg-red px-1 text-[10px] text-white">
                  {newSuggestions}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
