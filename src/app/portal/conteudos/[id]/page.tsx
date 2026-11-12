import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { loadContentDetail } from "@/lib/data";
import { ContentDetail } from "@/components/content-detail";

export default async function ConteudoCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, client } = await requireClient();
  const data = await loadContentDetail(supabase, id, user!.id);
  if (!data || data.content.client_id !== client.id) notFound();
  return <ContentDetail data={data} mode="client" backHref="/portal" />;
}
