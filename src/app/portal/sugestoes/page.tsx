import Link from "next/link";
import { ExternalLink, Paperclip } from "lucide-react";
import { requireClient } from "@/lib/auth";
import { loadSuggestions } from "@/lib/data";
import { FORMATS, SUGGESTION_STATUS } from "@/lib/pipelines";
import { timeAgo } from "@/lib/utils";
import { Chip, SectionTitle } from "@/components/ui";
import { PlatformIcon } from "@/components/platform";
import { SuggestionForm } from "@/components/suggestion-form";

export default async function MinhasIdeias({ searchParams }: { searchParams: Promise<{ nova?: string }> }) {
  const sp = await searchParams;
  const { supabase, client } = await requireClient();
  const items = await loadSuggestions(supabase, client.id);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
      <section>
        <SectionTitle>Sugerir uma ideia</SectionTitle>
        <SuggestionForm clientId={client.id} autoFocus={sp.nova === "1"} />
      </section>
      <section>
        <SectionTitle>Ideias enviadas</SectionTitle>
        {items.length ? (
          <div className="space-y-3">
            {items.map((s) => {
              const st = SUGGESTION_STATUS[s.status];
              return (
                <div key={s.id} className="card p-4">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Chip tone={st.tone}>{st.label}</Chip>
                    {s.format && <PlatformIcon platform={FORMATS[s.format].platform} size={16} />}
                    <span className="ml-auto text-xs font-bold text-muted">{timeAgo(s.created_at)}</span>
                  </div>
                  <p className="font-extrabold">{s.title}</p>
                  {s.description && <p className="mt-1 line-clamp-3 text-sm text-muted">{s.description}</p>}
                  <div className="mt-2 flex gap-3">
                    {s.reference_url && (
                      <a href={s.reference_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-extrabold text-blue">
                        <ExternalLink className="size-3.5" strokeWidth={3} /> Referência
                      </a>
                    )}
                    {s.attachment_url && (
                      <a href={s.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-extrabold text-blue">
                        <Paperclip className="size-3.5" strokeWidth={3} /> Anexo
                      </a>
                    )}
                  </div>
                  {s.admin_reply && <p className="mt-3 rounded-2xl bg-surface-2 px-3 py-2 text-sm">{s.admin_reply}</p>}
                  {s.content_id && (
                    <Link href={`/portal/conteudos/${s.content_id}`} className="mt-3 inline-block text-sm font-extrabold uppercase text-green">
                      Virou conteúdo! Ver →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="card p-5 text-muted">Você ainda não mandou nenhuma ideia. A primeira pode ser a melhor!</p>
        )}
      </section>
    </div>
  );
}
