import { requireAdmin } from "@/lib/auth";
import { loadSuggestions } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { SuggestionsAdmin } from "@/components/suggestions-admin";

export default async function Sugestoes() {
  const { supabase } = await requireAdmin();
  const items = await loadSuggestions(supabase);
  return (
    <>
      <PageHeader title="Sugestões" subtitle="Ideias enviadas pelos clientes. Transforme as boas em conteúdo." />
      <SuggestionsAdmin items={items} showClient />
    </>
  );
}
