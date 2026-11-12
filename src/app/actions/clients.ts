"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

export async function createClientAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Dê um nome para o cliente");
  const base = slugify(name) || "cliente";
  let slug = base;
  for (let i = 2; ; i++) {
    const { data } = await supabase.from("clients").select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    slug = `${base}-${i}`;
  }
  const { error } = await supabase.from("clients").insert({
    name,
    slug,
    color: String(formData.get("color") ?? "green"),
    youtube_url: String(formData.get("youtube_url") ?? "").trim() || null,
    instagram_handle: String(formData.get("instagram_handle") ?? "").trim().replace(/^@/, "") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
  redirect(`/clientes/${slug}`);
}

export async function updateClientAction(id: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("clients")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      color: String(formData.get("color") ?? "green"),
      youtube_url: String(formData.get("youtube_url") ?? "").trim() || null,
      instagram_handle: String(formData.get("instagram_handle") ?? "").trim().replace(/^@/, "") || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

async function linkProfile(userId: string, clientId: string) {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).single();
  if (profile?.role === "admin") throw new Error("Esse e-mail é de um admin");
  const { error } = await admin.from("profiles").update({ client_id: clientId, role: "client" }).eq("id", userId);
  if (error) throw new Error(error.message);
}

async function findUserByEmail(email: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  return data?.id ?? null;
}

/** Envia convite por e-mail. Se o usuário já existir, só vincula ao cliente. */
export async function inviteClientUser(clientId: string, rawEmail: string) {
  await requireAdmin();
  const email = rawEmail.trim().toLowerCase();
  if (!email.includes("@")) return { ok: false, message: "E-mail inválido" };
  const admin = createAdminClient();

  let userId = await findUserByEmail(email);
  if (!userId) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl()}/auth/callback`,
    });
    if (error) return { ok: false, message: error.message };
    userId = data.user.id;
  }
  try {
    await linkProfile(userId, clientId);
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  revalidatePath("/clientes", "layout");
  return { ok: true, message: "Convite enviado!" };
}

/**
 * Gera um link de acesso para mandar por WhatsApp (sem depender do e-mail).
 * Cria o usuário se ainda não existir.
 */
export async function generateAccessLink(clientId: string, rawEmail: string) {
  await requireAdmin();
  const email = rawEmail.trim().toLowerCase();
  if (!email.includes("@")) return { ok: false, message: "E-mail inválido", link: null };
  const admin = createAdminClient();

  let userId = await findUserByEmail(email);
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (error) return { ok: false, message: error.message, link: null };
    userId = data.user.id;
  }
  try {
    await linkProfile(userId, clientId);
  } catch (e) {
    return { ok: false, message: (e as Error).message, link: null };
  }
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${siteUrl()}/auth/callback` },
  });
  if (error) return { ok: false, message: error.message, link: null };
  revalidatePath("/clientes", "layout");
  return { ok: true, message: "Link gerado! Vale por 1 hora e funciona uma vez.", link: data.properties.action_link };
}

export async function removeClientUser(userId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ client_id: null }).eq("id", userId).eq("role", "client");
  if (error) throw new Error(error.message);
  revalidatePath("/clientes", "layout");
}
