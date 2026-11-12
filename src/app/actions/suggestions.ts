"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import type { Format, Platform, SuggestionStatus } from "@/lib/pipelines";
import { FORMATS } from "@/lib/pipelines";

export async function createSuggestion(input: {
  title: string;
  description: string;
  format: Format | null;
  reference_url: string;
  attachment_path?: string | null;
}) {
  const { supabase, user, profile } = await requireUser();
  if (!profile.client_id) return { ok: false, message: "Conta sem cliente vinculado" };
  if (!input.title.trim()) return { ok: false, message: "Dê um título para a ideia" };
  const platform: Platform | null = input.format ? FORMATS[input.format].platform : null;
  if (input.attachment_path && !input.attachment_path.startsWith(`${profile.client_id}/sugestoes/`)) {
    return { ok: false, message: "Anexo inválido" };
  }
  const { error } = await supabase.from("suggestions").insert({
    client_id: profile.client_id,
    created_by: user!.id,
    title: input.title.trim(),
    description: input.description.trim(),
    platform,
    format: input.format,
    reference_url: input.reference_url.trim() || null,
    attachment_path: input.attachment_path ?? null,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setSuggestionStatus(id: string, status: SuggestionStatus, reply?: string) {
  const { supabase } = await requireAdmin();
  const update: Record<string, unknown> = { status };
  if (reply !== undefined) update.admin_reply = reply.trim() || null;
  const { error } = await supabase.from("suggestions").update(update).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
