"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Heart, Loader2, Plus, Star, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { FORMATS } from "@/lib/pipelines";
import type { Client, Content, MediaWithUrl, TitleOption } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  addTitleOption,
  deleteMedia,
  deleteTitleOption,
  moveMedia,
  pickMedia,
  pickTitle,
  registerMedia,
  selectMedia,
  selectTitleOption,
} from "@/app/actions/contents";
import { Avatar, Button, Chip, Label, SectionTitle } from "./ui";
import { Modal } from "./client-form";

/* ------------------------------ Títulos ------------------------------ */

export function TitleOptions({ content, titles, isAdmin }: { content: Content; titles: TitleOption[]; isAdmin: boolean }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const label = content.format === "video" ? "Opções de título" : "Opções de gancho / título";

  return (
    <section>
      <SectionTitle>{label}</SectionTitle>
      <div className="space-y-2">
        {titles.map((t) => (
          <div
            key={t.id}
            className={cn("card flex items-center gap-3 px-4 py-3", t.is_selected && "border-green bg-green-soft/40")}
          >
            {isAdmin ? (
              <button
                onClick={() => start(() => selectTitleOption(content.id, t.id))}
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border-2",
                  t.is_selected ? "border-green bg-green text-white" : "border-border hover:border-green",
                )}
                title="Usar este título"
              >
                {t.is_selected && <Check className="size-4" strokeWidth={4} />}
              </button>
            ) : (
              t.is_selected && <Check className="size-5 shrink-0 text-green" strokeWidth={4} />
            )}
            <p className="min-w-0 flex-1 font-extrabold">{t.text}</p>
            {t.is_selected && <Chip tone="green">Escolhido</Chip>}
            {t.client_pick && isAdmin && (
              <Chip tone="pink">
                <Heart className="size-3 fill-current" /> Cliente
              </Chip>
            )}
            {!isAdmin && (
              <button
                onClick={() => start(async () => { await pickTitle(content.id, t.id); })}
                className={cn("rounded-full p-1.5", t.client_pick ? "text-pink" : "text-gray hover:text-pink")}
                title="Esse é o meu favorito"
              >
                <Heart className={cn("size-6", t.client_pick && "fill-current")} strokeWidth={2.5} />
              </button>
            )}
            {isAdmin && (
              <button onClick={() => start(() => deleteTitleOption(content.id, t.id))} className="rounded-xl p-1.5 text-gray hover:text-red" title="Remover">
                <Trash2 className="size-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        ))}
        {!titles.length && !isAdmin && <p className="text-muted">Ainda sem opções de título.</p>}
      </div>
      {isAdmin && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = text;
            setText("");
            start(() => addTitleOption(content.id, v));
          }}
        >
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Nova opção de título..." className="field" maxLength={100} />
          <Button type="submit" tone="blue" disabled={!text.trim() || pending} className="h-auto">
            <Plus className="size-5" strokeWidth={3} />
          </Button>
        </form>
      )}
      {isAdmin && text.length > 0 && <p className="mt-1 text-right text-xs font-bold text-muted">{text.length}/100</p>}
      {!isAdmin && titles.length > 1 && <p className="mt-2 text-sm text-muted">Toque no coração para marcar o seu favorito.</p>}
    </section>
  );
}

/* ------------------------------ Previews ------------------------------ */

function YouTubePreview({ url, title, client }: { url: string | null; title: string; client: Client }) {
  return (
    <div className="max-w-sm">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url && <img src={url} alt="" className="size-full object-cover" />}
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1 text-xs font-bold text-white">12:34</span>
      </div>
      <div className="mt-3 flex gap-3">
        <Avatar name={client.name} color={client.color} size={36} />
        <div className="min-w-0">
          <p className="line-clamp-2 text-[15px] font-bold leading-snug" style={{ fontFamily: "Roboto, Arial, sans-serif" }}>
            {title || "Título do vídeo"}
          </p>
          <p className="mt-0.5 text-xs text-muted" style={{ fontFamily: "Roboto, Arial, sans-serif" }}>
            {client.name} · 12 mil visualizações · há 2 horas
          </p>
        </div>
      </div>
    </div>
  );
}

function InstagramPreview({ media, aspect, client }: { media: MediaWithUrl[]; aspect: string; client: Client }) {
  const [i, setI] = useState(0);
  const cur = media[Math.min(i, media.length - 1)];
  return (
    <div className="w-full max-w-[320px] overflow-hidden rounded-2xl border-2 border-border bg-surface">
      <div className="flex items-center gap-2 px-3 py-2">
        <Avatar name={client.name} color={client.color} size={28} />
        <span className="text-sm font-extrabold">{client.instagram_handle ?? client.name}</span>
      </div>
      <div className="relative bg-surface-2" style={{ aspectRatio: aspect }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {cur?.url && <img src={cur.url} alt="" className="size-full object-cover" />}
        {media.length > 1 && (
          <>
            <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 text-xs font-bold text-white">
              {i + 1}/{media.length}
            </span>
            {i > 0 && (
              <button onClick={() => setI(i - 1)} className="absolute left-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black">
                <ArrowLeft className="size-4" strokeWidth={3} />
              </button>
            )}
            {i < media.length - 1 && (
              <button onClick={() => setI(i + 1)} className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black">
                <ArrowRight className="size-4" strokeWidth={3} />
              </button>
            )}
          </>
        )}
      </div>
      {media.length > 1 && (
        <div className="flex justify-center gap-1 py-2">
          {media.map((m, idx) => (
            <span key={m.id} className={cn("size-1.5 rounded-full", idx === i ? "bg-blue" : "bg-gray-soft")} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Mídias ------------------------------ */

export function MediaSection({
  content,
  client,
  media,
  isAdmin,
}: {
  content: Content;
  client: Client;
  media: MediaWithUrl[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const fmt = FORMATS[content.format];
  const isSlides = fmt.media === "slide";
  const [uploading, setUploading] = useState(0);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<MediaWithUrl | null>(null);
  const [, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | File[]) {
    const list = [...files].filter((f) => f.type.startsWith("image/"));
    if (!list.length) return setError("Envie arquivos de imagem (JPG, PNG, WEBP).");
    setError(null);
    setUploading(list.length);
    const supabase = createClient();
    const done: { path: string; name: string }[] = [];
    for (const f of list) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${content.client_id}/${content.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, f, { contentType: f.type, upsert: false });
      if (error) setError(error.message);
      else done.push({ path, name: f.name });
      setUploading((n) => n - 1);
    }
    if (done.length) {
      await registerMedia(content.id, done);
      router.refresh();
    }
  }

  const selected = media.find((m) => m.is_selected) ?? media[0];

  return (
    <section>
      <SectionTitle>{fmt.mediaLabel}</SectionTitle>

      {media.length > 0 && (
        <div className="mb-6 flex flex-col gap-6 rounded-3xl bg-surface-2 p-4 sm:flex-row sm:items-start sm:p-6">
          <div className="min-w-0 flex-1">
            <Label>Como vai ficar</Label>
            {content.format === "video" ? (
              <YouTubePreview url={selected?.url ?? null} title={content.title} client={client} />
            ) : (
              <InstagramPreview media={isSlides ? media : selected ? [selected] : []} aspect={fmt.aspect} client={client} />
            )}
          </div>
        </div>
      )}

      <div className={cn("grid gap-3", content.format === "video" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")}>
        {media.map((m, idx) => (
          <div key={m.id} className={cn("card overflow-hidden", m.is_selected && !isSlides && "border-green")}>
            <button className="relative block w-full bg-surface-2" style={{ aspectRatio: fmt.aspect }} onClick={() => setZoom(m)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {m.url && <img src={m.url} alt={m.file_name ?? ""} className="size-full object-cover" />}
              <div className="absolute left-2 top-2 flex gap-1">
                {isSlides && <span className="rounded-full bg-black/70 px-2 py-0.5 text-xs font-black text-white">{idx + 1}</span>}
                {m.is_selected && !isSlides && (
                  <span className="flex items-center gap-1 rounded-full bg-green px-2 py-0.5 text-[11px] font-extrabold uppercase text-white">
                    <Star className="size-3 fill-current" /> Escolhida
                  </span>
                )}
                {m.client_pick && (
                  <span className="flex items-center gap-1 rounded-full bg-pink px-2 py-0.5 text-[11px] font-extrabold uppercase text-white">
                    <Heart className="size-3 fill-current" /> {isAdmin ? "Cliente" : "Favorita"}
                  </span>
                )}
              </div>
            </button>
            <div className="flex items-center gap-1 p-2">
              {isAdmin ? (
                <>
                  {!isSlides && !m.is_selected && (
                    <Button size="sm" tone="green" onClick={() => start(() => selectMedia(content.id, m.id))}>
                      Escolher
                    </Button>
                  )}
                  {isSlides && (
                    <>
                      <button disabled={idx === 0} onClick={() => start(() => moveMedia(content.id, m.id, -1))} className="rounded-xl p-2 text-muted hover:bg-surface-2 disabled:opacity-30" title="Mover para trás">
                        <ArrowLeft className="size-4" strokeWidth={3} />
                      </button>
                      <button disabled={idx === media.length - 1} onClick={() => start(() => moveMedia(content.id, m.id, 1))} className="rounded-xl p-2 text-muted hover:bg-surface-2 disabled:opacity-30" title="Mover para frente">
                        <ArrowRight className="size-4" strokeWidth={3} />
                      </button>
                    </>
                  )}
                  <span className="flex-1" />
                  <button
                    onClick={() => confirm("Apagar esta imagem?") && start(() => deleteMedia(content.id, m.id))}
                    className="rounded-xl p-2 text-gray hover:bg-red-soft hover:text-red"
                    title="Apagar"
                  >
                    <Trash2 className="size-4" strokeWidth={2.5} />
                  </button>
                </>
              ) : (
                !isSlides &&
                media.length > 1 && (
                  <button
                    onClick={() => start(async () => { await pickMedia(content.id, m.id); })}
                    className={cn(
                      "flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-extrabold uppercase",
                      m.client_pick ? "bg-pink-soft text-pink-dark" : "text-muted hover:bg-surface-2",
                    )}
                  >
                    <Heart className={cn("size-4", m.client_pick && "fill-current")} strokeWidth={2.5} />
                    {m.client_pick ? "Minha favorita" : "Gostei dessa"}
                  </button>
                )
              )}
            </div>
          </div>
        ))}

        {isAdmin && (
          <button
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              upload(e.dataTransfer.files);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-[1.25rem] border-2 border-dashed p-6 text-center transition-colors",
              drag ? "border-blue bg-blue-soft" : "border-border-strong hover:bg-surface-2",
            )}
            style={{ aspectRatio: media.length ? fmt.aspect : undefined, minHeight: 160 }}
          >
            {uploading > 0 ? (
              <Loader2 className="size-8 animate-spin text-blue" strokeWidth={2.5} />
            ) : (
              <UploadCloud className="size-8 text-blue" strokeWidth={2.5} />
            )}
            <span className="text-sm font-extrabold">{uploading > 0 ? `Enviando ${uploading}...` : `Adicionar ${fmt.mediaLabel.toLowerCase()}`}</span>
            <span className="text-xs font-bold text-muted">Arraste ou clique · várias de uma vez</span>
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-soft px-3 py-2 text-sm text-red-dark">{error}</p>}
      {!isAdmin && !media.length && <p className="text-muted">Ainda não tem {fmt.mediaLabel.toLowerCase()} por aqui.</p>}
      {!isAdmin && media.length > 1 && !isSlides && <p className="mt-3 text-sm text-muted">Toque em “Gostei dessa” para marcar a sua favorita.</p>}

      <Modal open={!!zoom} onClose={() => setZoom(null)} title={zoom?.file_name ?? "Imagem"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {zoom?.url && <img src={zoom.url} alt="" className="w-full rounded-xl" />}
        {zoom?.url && (
          <a href={zoom.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-extrabold uppercase text-blue">
            Abrir em tamanho original
          </a>
        )}
      </Modal>
    </section>
  );
}
