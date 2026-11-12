"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, RotateCcw, Send } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { STATUS, type StatusKey } from "@/lib/pipelines";
import type { TimelineItem } from "@/lib/data";
import { addComment } from "@/app/actions/contents";
import { Avatar, Button, SectionTitle } from "./ui";
import { EmptyState } from "./mascot";

export function Conversation({ contentId, timeline, clientColor }: { contentId: string; timeline: TimelineItem[]; clientColor: string }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <section>
      <SectionTitle>Conversa</SectionTitle>
      {timeline.length ? (
        <div className="mb-4 space-y-3">
          {timeline.map((t) =>
            t.kind === "approval" ? (
              <div
                key={t.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border-2 p-3",
                  t.decision === "aprovado" ? "border-green bg-green-soft/50" : "border-orange bg-orange-soft/50",
                )}
              >
                {t.decision === "aprovado" ? (
                  <CheckCircle2 className="size-6 shrink-0 text-green" strokeWidth={2.5} />
                ) : (
                  <RotateCcw className="size-6 shrink-0 text-orange" strokeWidth={2.5} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">
                    {t.author} {t.decision === "aprovado" ? "aprovou" : "pediu ajuste"}
                    <span className="ml-2 text-xs font-bold text-muted">{timeAgo(t.at)}</span>
                  </p>
                  {t.comment && <p className="mt-1 whitespace-pre-wrap">{t.comment}</p>}
                  {t.to && (
                    <p className="mt-1 text-xs font-bold text-muted">
                      Foi para {STATUS[t.to as StatusKey]?.label ?? t.to}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div key={t.id} className={cn("flex items-end gap-2", t.mine && "flex-row-reverse")}>
                <Avatar name={t.author} color={t.authorRole === "admin" ? "blue" : clientColor} size={30} />
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    t.mine ? "rounded-br-md bg-blue text-white" : "rounded-bl-md bg-surface-2",
                  )}
                >
                  {!t.mine && <p className="text-xs font-extrabold opacity-70">{t.author}</p>}
                  <p className="whitespace-pre-wrap">{t.body}</p>
                  <p className={cn("mt-0.5 text-[10px] font-bold", t.mine ? "text-white/70" : "text-muted")}>{timeAgo(t.at)}</p>
                </div>
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="mb-4">
          <EmptyState title="Nenhuma mensagem ainda" mood="happy">
            Dúvidas, ajustes, ideias? Escreva aqui.
          </EmptyState>
        </div>
      )}
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const body = text;
          start(async () => {
            const r = await addComment({ contentId }, body);
            if (r.ok) setText("");
            else setError(r.message ?? "Erro");
          });
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          }}
          rows={2}
          placeholder="Escreva uma mensagem..."
          className="field resize-none"
        />
        <Button type="submit" tone="blue" disabled={!text.trim() || pending} className="h-12 shrink-0" aria-label="Enviar">
          <Send className="size-5" strokeWidth={2.5} />
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red">{error}</p>}
    </section>
  );
}
