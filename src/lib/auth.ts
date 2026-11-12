import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Client, Profile } from "./types";

export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null as Profile | null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  return { supabase, user, profile };
});

export async function requireAdmin() {
  const s = await getSession();
  if (!s.user) redirect("/login");
  if (s.profile?.role !== "admin") redirect("/portal");
  return s as typeof s & { profile: Profile };
}

export async function requireClient() {
  const s = await getSession();
  if (!s.user) redirect("/login");
  if (s.profile?.role === "admin") redirect("/painel");
  if (!s.profile?.client_id) redirect("/sem-acesso");
  const { data: client } = await s.supabase.from("clients").select("*").eq("id", s.profile.client_id).single<Client>();
  if (!client) redirect("/sem-acesso");
  return { ...s, profile: s.profile, client };
}

/** Para ações acessíveis por ambos: devolve o perfil ou lança. */
export async function requireUser() {
  const s = await getSession();
  if (!s.user || !s.profile) throw new Error("Faça login novamente");
  return s as typeof s & { profile: Profile };
}
