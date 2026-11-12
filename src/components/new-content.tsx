"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FORMATS, PLATFORMS, type Format } from "@/lib/pipelines";
import { createContent } from "@/app/actions/contents";
import { Button, Label } from "./ui";
import { Modal } from "./client-form";
import { PlatformIcon } from "./platform";

export function FormatPicker({ value, onChange }: { value: Format | null; onChange: (f: Format) => void }) {
  return (
    <div className="space-y-3">
      {(Object.keys(PLATFORMS) as (keyof typeof PLATFORMS)[]).map((p) => (
        <div key={p}>
          <div className="mb-2 flex items-center gap-2">
            <PlatformIcon platform={p} size={20} />
            <span className="text-sm font-extrabold">{PLATFORMS[p].label}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PLATFORMS[p].formats.map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => onChange(f)}
                className={cn(
                  "rounded-2xl border-2 border-b-4 px-3 py-3 text-sm font-extrabold transition-colors",
                  value === f ? "border-blue bg-blue-soft text-blue-dark" : "border-border hover:bg-surface-2",
                )}
              >
                {FORMATS[f].label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function NewContentButton({ clientId, defaultDate }: { clientId: string; defaultDate?: string }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format | null>("video");
  const [date, setDate] = useState(defaultDate ?? "");
  const [pending, start] = useTransition();

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus strokeWidth={3} className="size-4" /> Novo conteúdo
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo conteúdo">
        <div className="space-y-6">
          <div>
            <Label>Formato</Label>
            <FormatPicker value={format} onChange={setFormat} />
          </div>
          <div>
            <Label hint="opcional">Data de publicação</Label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
          </div>
          <Button
            className="w-full"
            disabled={!format || pending}
            onClick={() => start(() => createContent(clientId, format!, date || null))}
          >
            {pending ? "Criando..." : "Criar e abrir"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
