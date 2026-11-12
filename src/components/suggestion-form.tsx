"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FORMATS, PLATFORMS, type Format } from "@/lib/pipelines";
import { createClient } from "@/lib/supabase/client";
import { createSuggestion } from "@/app/actions/suggestions";
import { Button, Label } from "./ui";
import { PlatformIcon } from "./platform";
import { Mascot } from "./mascot";
import { celebrate } from "./approval-box";

export function SuggestionForm({ clientId, autoFocus }: { clientId: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<Format | null>(null);
  const [ref, setRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      let attachment_path: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        const path = `${clientId}/sugestoes/${crypto.randomUUID()}.${ext}`;
        const { error } = await createClient().storage.from("media").upload(path, file, { contentType: file.type });
        if (error) return setError(`Não consegui enviar o anexo: ${error.message}`);
        attachment_path = path;
      }
      const r = await createSuggestion({ title, description, format, reference_url: ref, attachment_path });
      if (!r.ok) return setError(r.message ?? "Erro");
      celebrate();
      setSent(true);
      setTitle("");
      setDescription("");
      setFormat(null);
      setRef("");
      setFile(null);
      router.refresh();
    });
  }

  if (sent) {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <Mascot mood="party" size={100} />
        <h2 className="text-2xl font-black">Ideia enviada!</h2>
        <p className="text-muted">A gente vai dar uma olhada e te responde por aqui.</p>
        <Button tone="orange" onClick={() => setSent(false)} className="mt-2">
          Mandar outra
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-5">
      <div>
        <Label>Qual é a ideia?</Label>
        <input
          autoFocus={autoFocus}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Vídeo respondendo as dúvidas mais comuns sobre ansiedade"
          className="field"
        />
      </div>
      <div>
        <Label hint="opcional">Conta mais</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Por que acha que vai funcionar, o que não pode faltar..."
          className="field"
        />
      </div>
      <div>
        <Label hint="opcional">Onde você imagina?</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PLATFORMS) as (keyof typeof PLATFORMS)[]).flatMap((p) =>
            PLATFORMS[p].formats.map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => setFormat(format === f ? null : f)}
                className={cn(
                  "flex items-center gap-1.5 rounded-2xl border-2 border-b-4 px-3 py-2 text-sm font-extrabold",
                  format === f ? "border-blue bg-blue-soft text-blue-dark" : "border-border",
                )}
              >
                <PlatformIcon platform={p} size={18} />
                {p === "youtube" ? "YouTube" : FORMATS[f].label}
              </button>
            )),
          )}
        </div>
      </div>
      <div>
        <Label hint="opcional">Link de referência</Label>
        <input type="url" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="https://..." className="field" />
      </div>
      <div>
        {file ? (
          <div className="flex items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2">
            <Paperclip className="size-4 text-blue" strokeWidth={3} />
            <span className="min-w-0 flex-1 truncate text-sm font-bold">{file.name}</span>
            <button type="button" onClick={() => setFile(null)} className="text-muted" aria-label="Remover anexo">
              <X className="size-4" strokeWidth={3} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="flex items-center gap-1.5 text-sm font-extrabold uppercase text-blue">
            <Paperclip className="size-4" strokeWidth={3} /> Anexar print ou arquivo
          </button>
        )}
        <input
          ref={input}
          type="file"
          hidden
          accept="image/*,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && f.size > 50 * 1024 * 1024) setError("Arquivo muito grande (máx. 50 MB)");
            else setFile(f ?? null);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="rounded-xl bg-red-soft px-3 py-2 text-sm text-red-dark">{error}</p>}
      <Button type="submit" tone="orange" size="lg" className="w-full" disabled={!title.trim() || pending}>
        {pending ? "Enviando..." : "Enviar ideia"}
      </Button>
    </form>
  );
}
