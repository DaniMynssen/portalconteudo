import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireClient } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/ui";
import { PortalTabs, SuggestFab } from "@/components/portal-nav";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { client } = await requireClient();
  return (
    <div className="min-h-dvh">
      <header className="border-b-2 border-border">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/portal" className="flex min-w-0 items-center gap-3">
            <Avatar name={client.name} color={client.color} size={40} />
            <div className="min-w-0">
              <p className="truncate font-black leading-tight">{client.name}</p>
              <p className="text-xs font-extrabold text-muted">
                pauta<span className="text-green">.</span>
              </p>
            </div>
          </Link>
          <span className="flex-1" />
          <form action={signOut}>
            <button className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold uppercase text-muted hover:bg-surface-2">
              <LogOut className="size-4" strokeWidth={3} /> Sair
            </button>
          </form>
        </div>
        <PortalTabs />
      </header>
      <main className="mx-auto max-w-4xl px-4 pb-32 pt-6 sm:px-6">{children}</main>
      <SuggestFab />
    </div>
  );
}
