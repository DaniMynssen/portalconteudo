import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireAdmin();
  const { count } = await supabase
    .from("suggestions")
    .select("id", { count: "exact", head: true })
    .eq("status", "nova");

  return (
    <div className="flex min-h-dvh">
      <AdminNav newSuggestions={count ?? 0} />
      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
