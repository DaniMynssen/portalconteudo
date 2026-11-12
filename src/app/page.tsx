import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const { user, profile } = await getSession();
  if (!user) redirect("/login");
  if (profile?.role === "admin") redirect("/painel");
  redirect("/portal");
}
