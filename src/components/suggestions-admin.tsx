"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Paperclip, Sparkles } from "lucide-react";
import { FORMATS, SUGGESTION_STATUS, type Format } from "@/lib/pipelines";
import type { Suggestion } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { setSuggestionStatus } from "@/app/actions/suggestions";
import { createContent } from "@/app/actions/contents";
import { Avatar, Button, Chip, Label } from "./ui";
import { Modal } from "./client-form";
import { FormatPicker } from "./new-content";
import { PlatformIcon } from "./platform";
import { EmptyState } from "./mascot";

export type SuggestionItem = Suggestion & {
  client: { name: string; color: string; slug: string } | null;
  attachment_url: string | null;
};

function SuggestionCard({ s, showClient }: { s: SuggestionItem; showClient?: boolean }) {
  const [pending, start] = useTransition();
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState(s.admin_reply ?? "");
  const [converting, setConverting] = useState(false);
  const [format, setFormat] = useState<Format | null>(s.format ?? "video");
  const [date, setDate] = useState("");
  const st = SUGGESTION_STATUS[s.status];

  return (
    <div className="card p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {showClient && s.client && (
          <span className="flex items-center gap-1.5 text-sm font-extrabold">
            <Avatar name={s.client.name} color={s.client.color} size={22} /> {s.client.name}
          </span>
        )}
        <Chip tone={st.tone}>{st.label}</Chip>
        {s.format && (
          <span className="flex items-center gap-1 text-xs font-extrabold uppercase text-muted">
            <PlatformIcon platform={FORMATS[s.format].platform} size={16} /> {FORMATS[s.format].label}
          </span>
        )}
        <span className="ml-auto text-xs font-bold text-muted">{timeAgo(s.created_at)}</span>
      </div>
      <h3 className="text-lg font-black">{s.title}</h3>
      {s.description && <p className="mt-1 whitespace-pre-wrap text-[15px]">{s.description}</p>}
      <div className="mt-2 flex flex-wrap gap-3">
        {s.reference_url && (
          <a href={s.reference_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-extrabold text-blue">
            <ExternalLink className="size-4" strokeWidth={2.5} /> Referência
          </a>
        )}
        {s.attachment_url && (
          <a href={s.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-extrabold text-blue">
            <Paperclip className="size-4" strokeWidth={2.5} /> Anexo
          </a>
        )}
      </div>
      {s.admin_reply && !replying && (
        <p className="mt-3 rounded-2xl bg-surface-2 px-3 py-2 text-sm">
          <b>Sua resposta:</b> {s.admin_reply}
        </p>
      )}

      {replying && (
        <div className="mt-3 space-y-2">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} className="field" placeholder="Explique o motivo (o cliente vai ver)" />
          <div className="flex gap-2">
            <Button
              size="sm"
              tone="red"
              disabled={pending}
              onClick={() => start(async () => { await setSuggestionStatus(s.id, "recusada", reply); setReplying(false); })}
            >
              Recusar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {s.status !== "aceita" && s.status !== "recusada" && !replying && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setConverting(true)}>
            <Sparkles className="size-4" strokeWidth={3} /> Virar conteúdo
          </Button>
          {s.status === "nova" && (
            <Button size="sm" tone="yellow" disabled={pending} onClick={() => start(async () => { await setSuggestionStatus(s.id, "em_analise"); })}>
              Em análise
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setReplying(true)}>
            Recusar
          </Button>
        </div>
      )}
      {s.content_id && (
        <Link href={`/conteudos/${s.content_id}`} className="mt-3 inline-block text-sm font-extrabold uppercase text-blue">
          Abrir conteúdo →
        </Link>
      )}

      <Modal open={converting} onClose={() => setConverting(false)} title="Transformar em conteúdo">
        <div className="space-y-6">
          <div>
            <Label>Formato</Label>
            <FormatPicker value={format} onChange={setFormat} />
          </div>
          <div>
            <Label hint="opcional">Data de publicação</Label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
          </div>
          <Button className="w-full" disabled={!format || pending} onClick={() => start(() => createContent(s.client_id, format!, date || null, s.id))}>
            {pending ? "Criando..." : "Criar conteúdo"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function SuggestionsAdmin({ items, showClient }: { items: SuggestionItem[]; showClient?: boolean }) {
  if (!items.length)
    return (
      <EmptyState title="Nenhuma sugestão por aqui" mood="sleepy">
        Quando o cliente mandar uma ideia pelo portal, ela aparece aqui.
      </EmptyState>
    );
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((s) => (
        <SuggestionCard key={s.id} s={s} showClient={showClient} />
      ))}
    </div>
  );
}
