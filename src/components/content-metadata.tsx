"use client";

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Content, ContentMetadata } from "@/lib/types";
import { Label, SectionTitle } from "./ui";

function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  if (!text) return null;
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className={cn("flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-extrabold uppercase", ok ? "text-green" : "text-blue hover:bg-blue-soft")}
    >
      {ok ? <Check className="size-3.5" strokeWidth={3.5} /> : <Copy className="size-3.5" strokeWidth={3} />}
      {ok ? "Copiado" : "Copiar"}
    </button>
  );
}

function Counter({ n, max }: { n: number; max: number }) {
  return <span className={cn("tabular-nums", n > max ? "text-red" : n > max * 0.9 ? "text-orange" : "")}>{n}/{max}</span>;
}

function TextBlock({
  label,
  value,
  max,
  rows = 6,
  editable,
  placeholder,
  onSave,
  mono,
}: {
  label: string;
  value: string;
  max?: number;
  rows?: number;
  editable: boolean;
  placeholder?: string;
  onSave: (v: string) => void;
  mono?: boolean;
}) {
  const [v, setV] = useState(value);
  return (
    <div>
      <Label
        hint={
          <span className="flex items-center gap-2">
            {max && <Counter n={v.length} max={max} />}
            <CopyButton text={v} />
          </span>
        }
      >
        {label}
      </Label>
      {editable ? (
        <textarea
          value={v}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => v !== value && onSave(v)}
          className={cn("field resize-y leading-relaxed", mono && "font-mono text-sm")}
        />
      ) : (
        <div className={cn("card whitespace-pre-wrap p-4 leading-relaxed", !v && "italic text-muted", mono && "font-mono text-sm")}>
          {v || "Ainda não preenchido"}
        </div>
      )}
    </div>
  );
}

function TagsInput({
  label,
  value,
  editable,
  prefix,
  maxItems,
  maxChars,
  placeholder,
  onSave,
}: {
  label: string;
  value: string[];
  editable: boolean;
  prefix?: string;
  maxItems?: number;
  maxChars?: number;
  placeholder: string;
  onSave: (v: string[]) => void;
}) {
  const [tags, setTags] = useState(value);
  const [draft, setDraft] = useState("");
  const clean = (t: string) => t.trim().replace(prefix ? new RegExp(`^\\${prefix}+`) : /^$/, "");
  const commit = (next: string[]) => {
    setTags(next);
    onSave(next);
  };
  const add = (raw: string) => {
    const parts = raw.split(/[,\n]/).map(clean).filter(Boolean);
    const next = [...tags];
    for (const p of parts) if (!next.includes(p)) next.push(p);
    if (next.length !== tags.length) commit(next);
    setDraft("");
  };
  const asText = tags.map((t) => (prefix ? prefix + t : t)).join(prefix ? " " : ", ");
  const chars = tags.join(",").length;

  return (
    <div>
      <Label
        hint={
          <span className="flex items-center gap-2">
            {maxItems && <Counter n={tags.length} max={maxItems} />}
            {maxChars && <Counter n={chars} max={maxChars} />}
            <CopyButton text={asText} />
          </span>
        }
      >
        {label}
      </Label>
      <div className={cn("flex flex-wrap gap-1.5", editable ? "field" : "card p-3")}>
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-full bg-blue-soft px-2.5 py-1 text-sm font-extrabold text-blue-dark">
            {prefix}
            {t}
            {editable && (
              <button type="button" onClick={() => commit(tags.filter((x) => x !== t))} className="opacity-60 hover:opacity-100" aria-label={`Remover ${t}`}>
                <X className="size-3.5" strokeWidth={3.5} />
              </button>
            )}
          </span>
        ))}
        {editable ? (
          <input
            value={draft}
            onChange={(e) => {
              if (/[,\n]/.test(e.target.value)) add(e.target.value);
              else setDraft(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(draft);
              } else if (e.key === "Backspace" && !draft && tags.length) {
                commit(tags.slice(0, -1));
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              add(e.clipboardData.getData("text").replace(/\s+#/g, ",#"));
            }}
            onBlur={() => draft && add(draft)}
            placeholder={tags.length ? "" : placeholder}
            className="min-w-32 flex-1 bg-transparent py-1 outline-none"
          />
        ) : (
          !tags.length && <span className="italic text-muted">Ainda não preenchido</span>
        )}
      </div>
    </div>
  );
}

export function MetadataSection({
  content,
  editable,
  onSave,
}: {
  content: Content;
  editable: boolean;
  onSave: (m: ContentMetadata) => void;
}) {
  const m = content.metadata ?? {};
  if (content.platform === "youtube") {
    return (
      <section className="space-y-6">
        <SectionTitle>Metadados do YouTube</SectionTitle>
        <TextBlock
          label="Descrição"
          value={m.description ?? ""}
          max={5000}
          rows={10}
          editable={editable}
          placeholder="Primeiras 2 linhas são as mais importantes — é o que aparece antes do 'mais'."
          onSave={(description) => onSave({ description })}
        />
        <TagsInput
          label="Tags"
          value={m.tags ?? []}
          maxChars={500}
          editable={editable}
          placeholder="Digite e aperte Enter (ou cole separado por vírgula)"
          onSave={(tags) => onSave({ tags })}
        />
        <TextBlock
          label="Capítulos"
          value={m.chapters ?? ""}
          rows={6}
          mono
          editable={editable}
          placeholder={"00:00 Introdução\n01:30 Primeiro ponto\n..."}
          onSave={(chapters) => onSave({ chapters })}
        />
      </section>
    );
  }
  return (
    <section className="space-y-6">
      <SectionTitle>Legenda do Instagram</SectionTitle>
      <TextBlock
        label="Legenda"
        value={m.caption ?? ""}
        max={2200}
        rows={10}
        editable={editable}
        placeholder="A primeira linha é o gancho — é o que aparece antes do 'mais'."
        onSave={(caption) => onSave({ caption })}
      />
      <TagsInput
        label="Hashtags"
        value={m.hashtags ?? []}
        prefix="#"
        maxItems={30}
        editable={editable}
        placeholder="#hashtag e Enter"
        onSave={(hashtags) => onSave({ hashtags })}
      />
      <TextBlock
        label="Marcações e collab"
        value={m.mentions ?? ""}
        rows={2}
        editable={editable}
        placeholder="@perfil, @parceiro"
        onSave={(mentions) => onSave({ mentions })}
      />
    </section>
  );
}
