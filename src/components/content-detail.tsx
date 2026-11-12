"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, FileText, Image as ImageIcon, Loader2, MessageCircle, PenLine, Tags, Trash2, LayoutGrid } from "lucide-react";
import { cn, fmtDate } from "@/lib/utils";
import { FORMATS, STATUS, type Format, type StatusKey } from "@/lib/pipelines";
import type { ContentDetailData } from "@/lib/data";
import type { ContentMetadata } from "@/lib/types";
import { deleteContent, updateContent } from "@/app/actions/contents";
import { ProgressTrail } from "./progress-trail";
import { PlatformIcon, StatusChip } from "./platform";
import { Avatar, Label, SectionTitle } from "./ui";
import { ScriptEditor } from "./script-editor";
import { MediaSection, TitleOptions } from "./content-media";
import { MetadataSection } from "./content-metadata";
import { Conversation } from "./conversation";
import { ApprovalBox } from "./approval-box";
import { FormatPicker } from "./new-content";

const APPROVAL_WHAT: Record<Format, string> = {
  video: "o título e a thumbnail",
  reels: "o roteiro",
  carrossel: "a copy e o design",
  post: "a copy e a arte",
  stories: "o material",
};

type Tab = "geral" | "briefing" | "roteiro" | "midias" | "metadados" | "conversa";

export function ContentDetail({ data, mode, backHref }: { data: ContentDetailData; mode: "admin" | "client"; backHref: string }) {
  const { content, client, titles, media, timeline } = data;
  const isAdmin = mode === "admin";
  const fmt = FORMATS[content.format];
  const [tab, setTab] = useState<Tab>(content.status === "aprovacao" ? "midias" : "geral");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [, start] = useTransition();

  function save(patch: Parameters<typeof updateContent>[1]) {
    if (!isAdmin) return;
    setSaving("saving");
    start(async () => {
      const r = await updateContent(content.id, patch);
      setSaving(r.ok ? "saved" : "error");
      if (r.ok) setTimeout(() => setSaving((s) => (s === "saved" ? "idle" : s)), 1800);
    });
  }
  const saveMeta = (m: ContentMetadata) => save({ metadata: m });

  const tabs: { key: Tab; label: string; icon: typeof FileText; badge?: number }[] = [
    { key: "geral", label: "Visão geral", icon: LayoutGrid },
    { key: "briefing", label: "Briefing", icon: FileText },
    { key: "roteiro", label: fmt.scriptLabel, icon: PenLine },
    { key: "midias", label: content.format === "video" ? "Título & Thumb" : fmt.mediaLabel, icon: ImageIcon, badge: media.length },
    { key: "metadados", label: content.platform === "youtube" ? "Metadados" : "Legenda", icon: Tags },
    { key: "conversa", label: "Conversa", icon: MessageCircle, badge: timeline.length },
  ];

  return (
    <div>
      {/* Topo */}
      <div className="mb-5 flex items-center gap-3">
        <Link href={backHref} className="btn3d h-10 w-10 !px-0" data-variant="ghost" aria-label="Voltar">
          <ArrowLeft strokeWidth={3} className="size-5" />
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <PlatformIcon platform={content.platform} size={24} />
          <span className="text-sm font-extrabold uppercase tracking-wide text-muted">{fmt.label}</span>
          {isAdmin && (
            <span className="flex items-center gap-1.5 truncate text-sm font-bold text-muted">
              · <Avatar name={client.name} color={client.color} size={18} /> {client.name}
            </span>
          )}
        </div>
        {isAdmin && (
          <span className={cn("flex items-center gap-1 text-xs font-extrabold uppercase", saving === "error" ? "text-red" : "text-muted")}>
            {saving === "saving" && <><Loader2 className="size-3.5 animate-spin" strokeWidth={3} /> Salvando</>}
            {saving === "saved" && <><Check className="size-3.5 text-green" strokeWidth={4} /> Salvo</>}
            {saving === "error" && "Erro ao salvar"}
          </span>
        )}
      </div>

      {/* Título */}
      {isAdmin ? (
        <input
          defaultValue={content.title}
          key={content.title}
          onBlur={(e) => e.target.value !== content.title && save({ title: e.target.value })}
          placeholder="Título do conteúdo"
          className="mb-2 w-full rounded-xl bg-transparent text-2xl font-black tracking-tight outline-none placeholder:text-gray focus:bg-surface-2 sm:text-3xl"
        />
      ) : (
        <h1 className="mb-2 text-2xl font-black tracking-tight sm:text-3xl">{content.title || "Sem título ainda"}</h1>
      )}
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm font-bold text-muted">
        <span className="capitalize">{content.publish_date ? fmtDate(content.publish_date, "EEEE, dd 'de' MMMM") : "Sem data"}</span>
        <StatusChip status={content.status} />
        {content.post_url && (
          <a href={content.post_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue">
            <ExternalLink className="size-4" strokeWidth={2.5} /> Ver publicado
          </a>
        )}
      </div>

      {/* Trilha */}
      <div className="card mb-6 px-3 pb-3 pt-4">
        <ProgressTrail format={content.format} status={content.status} onSelect={isAdmin ? (s) => save({ status: s as StatusKey }) : undefined} />
        {isAdmin && <p className="mt-1 px-2 text-xs font-bold text-muted">Toque numa etapa para mover o conteúdo.</p>}
      </div>

      {content.status === "aprovacao" && (
        <div className="mb-6">
          <ApprovalBox contentId={content.id} isAdmin={isAdmin} whatToApprove={APPROVAL_WHAT[content.format]} />
        </div>
      )}

      {/* Abas */}
      <div className="no-scrollbar sticky top-0 z-20 -mx-4 mb-6 flex gap-1 overflow-x-auto border-b-2 border-border bg-bg px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {tabs.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "-mb-[2px] flex items-center gap-1.5 whitespace-nowrap border-b-4 px-3 py-3 text-sm font-extrabold uppercase tracking-wide",
              tab === key ? "border-blue text-blue" : "border-transparent text-muted hover:text-ink",
            )}
          >
            <Icon className="size-4" strokeWidth={3} />
            {label}
            {!!badge && <span className="rounded-full bg-surface-2 px-1.5 text-[11px]">{badge}</span>}
          </button>
        ))}
      </div>

      {tab === "geral" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-5">
            <SectionTitle>Detalhes</SectionTitle>
            {isAdmin ? (
              <>
                <div>
                  <Label>Data de publicação</Label>
                  <input
                    type="date"
                    defaultValue={content.publish_date ?? ""}
                    onChange={(e) => save({ publish_date: e.target.value || null })}
                    className="field"
                  />
                </div>
                <div>
                  <Label>Formato</Label>
                  <FormatPicker
                    value={content.format}
                    onChange={(f) => {
                      if (f === content.format) return;
                      if (confirm(`Mudar para ${FORMATS[f].label}? Se a etapa atual não existir no novo formato, ele volta para Ideia.`)) save({ format: f });
                    }}
                  />
                </div>
                <div>
                  <Label>Link do post publicado</Label>
                  <input
                    type="url"
                    defaultValue={content.post_url ?? ""}
                    onBlur={(e) => e.target.value !== (content.post_url ?? "") && save({ post_url: e.target.value || null })}
                    placeholder={content.platform === "youtube" ? "https://youtube.com/watch?v=..." : "https://instagram.com/p/..."}
                    className="field"
                  />
                </div>
              </>
            ) : (
              <div className="card divide-y-2 divide-border">
                {[
                  ["Data", content.publish_date ? fmtDate(content.publish_date, "dd/MM/yyyy (EEEE)") : "A definir"],
                  ["Formato", `${content.platform === "youtube" ? "YouTube" : "Instagram"} · ${fmt.label}`],
                  ["Etapa", STATUS[content.status as StatusKey]?.label ?? content.status],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-4 py-3">
                    <span className="font-extrabold text-muted">{k}</span>
                    <span className="text-right font-extrabold capitalize">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section>
            <SectionTitle>Observações</SectionTitle>
            {isAdmin ? (
              <textarea
                defaultValue={content.notes}
                onBlur={(e) => e.target.value !== content.notes && save({ notes: e.target.value })}
                rows={8}
                placeholder="Anotações visíveis para o cliente (ex.: gravar com camisa clara)"
                className="field"
              />
            ) : (
              <div className={cn("card whitespace-pre-wrap p-4", !content.notes && "italic text-muted")}>{content.notes || "Nenhuma observação."}</div>
            )}
            {(media[0]?.url || content.title) && (
              <button onClick={() => setTab("midias")} className="card-pop mt-6 flex w-full items-center gap-3 p-3 text-left">
                {media.find((m) => m.is_selected)?.url || media[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(media.find((m) => m.is_selected) ?? media[0])!.url!}
                    alt=""
                    className="h-16 shrink-0 rounded-lg object-cover"
                    style={{ aspectRatio: fmt.aspect }}
                  />
                ) : null}
                <span className="font-extrabold">Ver {content.format === "video" ? "títulos e thumbs" : fmt.mediaLabel.toLowerCase()} →</span>
              </button>
            )}
          </section>
          {isAdmin && (
            <div className="lg:col-span-2">
              <button
                onClick={() => confirm("Apagar este conteúdo de vez? Isso remove também as imagens.") && start(() => deleteContent(content.id, client.slug))}
                className="flex items-center gap-2 text-sm font-extrabold uppercase text-red"
              >
                <Trash2 className="size-4" strokeWidth={3} /> Apagar conteúdo
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "briefing" && (
        <section>
          <SectionTitle>Briefing</SectionTitle>
          {isAdmin ? (
            <textarea
              defaultValue={content.briefing}
              onBlur={(e) => e.target.value !== content.briefing && save({ briefing: e.target.value })}
              rows={14}
              placeholder={"Objetivo do conteúdo, público, mensagem principal, referências, CTA..."}
              className="field leading-relaxed"
            />
          ) : (
            <div className={cn("card whitespace-pre-wrap p-5 leading-relaxed", !content.briefing && "italic text-muted")}>
              {content.briefing || "O briefing ainda não foi escrito."}
            </div>
          )}
        </section>
      )}

      {tab === "roteiro" && (
        <section>
          <SectionTitle>{fmt.scriptLabel}</SectionTitle>
          {!isAdmin && !content.script ? (
            <div className="card p-5 italic text-muted">Ainda não tem {fmt.scriptLabel.toLowerCase()} por aqui.</div>
          ) : (
            <ScriptEditor
              value={content.script}
              editable={isAdmin}
              placeholder={content.format === "carrossel" ? "Slide 1: gancho...\nSlide 2: ..." : "Gancho, desenvolvimento, CTA..."}
              onSave={(html) => save({ script: html })}
            />
          )}
        </section>
      )}

      {tab === "midias" && (
        <div className="space-y-10">
          <TitleOptions content={content} titles={titles} isAdmin={isAdmin} />
          <MediaSection content={content} client={client} media={media} isAdmin={isAdmin} />
        </div>
      )}

      {tab === "metadados" && <MetadataSection content={content} editable={isAdmin} onSave={saveMeta} />}

      {tab === "conversa" && <Conversation contentId={content.id} timeline={timeline} clientColor={client.color} />}
    </div>
  );
}
