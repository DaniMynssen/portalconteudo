import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import type { Client, Content } from "@/lib/types";
import { Avatar, Chip, PageHeader } from "@/components/ui";
import { EmptyState } from "@/components/mascot";
import { NewClientButton } from "@/components/client-form";
import { PlatformIcon } from "@/components/platform";
import { todayISO } from "@/lib/utils";

export default async function Clientes() {
  const { supabase } = await requireAdmin();
  const [{ data: clients }, { data: upcoming }] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("contents").select("client_id, status, publish_date").gte("publish_date", todayISO()),
  ]);

  const stats = new Map<string, { next: number; pending: number }>();
  for (const c of (upcoming as Pick<Content, "client_id" | "status">[]) ?? []) {
    const s = stats.get(c.client_id) ?? { next: 0, pending: 0 };
    s.next++;
    if (c.status === "aprovacao") s.pending++;
    stats.set(c.client_id, s);
  }

  return (
    <>
      <PageHeader title="Clientes" subtitle="Escolha um cliente para ver o calendário.">
        <NewClientButton />
      </PageHeader>

      {clients?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(clients as Client[]).map((c) => {
            const s = stats.get(c.id);
            return (
              <Link key={c.id} href={`/clientes/${c.slug}`} className="card-pop flex flex-col gap-4 p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} color={c.color} size={52} className="wiggle" />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black">{c.name}</p>
                    <div className="mt-1 flex gap-1.5">
                      {c.youtube_url && <PlatformIcon platform="youtube" size={20} />}
                      {c.instagram_handle && <PlatformIcon platform="instagram" size={20} />}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Chip tone="blue">{s?.next ?? 0} próximos</Chip>
                  {!!s?.pending && <Chip tone="yellow">{s.pending} aguardando</Chip>}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Nenhum cliente ainda" mood="happy" action={<NewClientButton />}>
          Crie o primeiro cliente para começar a montar o calendário.
        </EmptyState>
      )}
    </>
  );
}
