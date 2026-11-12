import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { loadContentDetail } from "@/lib/data";
import { ContentDetail } from "@/components/content-detail";

export default async function ConteudoAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  const data = await loadContentDetail(supabase, id, user!.id);
  if (!data) notFound();
  return <ContentDetail data={data} mode="admin" backHref={`/clientes/${data.client.slug}`} />;
}
