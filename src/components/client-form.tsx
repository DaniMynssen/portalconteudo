"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/types";
import { createClientAction, updateClientAction } from "@/app/actions/clients";
import { Button, CLIENT_COLORS, Label, TONE } from "./ui";

export function ClientFields({ client }: { client?: Client }) {
  const [color, setColor] = useState(client?.color ?? "green");
  return (
    <div className="space-y-4">
      <div>
        <Label>Nome</Label>
        <input name="name" required defaultValue={client?.name} placeholder="Ex.: Brunno Moleta" className="field" />
      </div>
      <div>
        <Label>Cor</Label>
        <input type="hidden" name="color" value={color} />
        <div className="flex flex-wrap gap-2">
          {CLIENT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn("grid size-10 place-items-center rounded-full text-white", TONE[c].bg)}
              style={{ boxShadow: "inset 0 -3px 0 rgba(0,0,0,.2)" }}
              aria-label={c}
            >
              {color === c && <Check strokeWidth={4} className="size-5" />}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Canal do YouTube</Label>
          <input name="youtube_url" defaultValue={client?.youtube_url ?? ""} placeholder="youtube.com/@canal" className="field" />
        </div>
        <div>
          <Label>Instagram</Label>
          <input name="instagram_handle" defaultValue={client?.instagram_handle ?? ""} placeholder="@perfil" className="field" />
        </div>
      </div>
    </div>
  );
}

export function NewClientButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus strokeWidth={3} className="size-4" /> Novo cliente
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo cliente">
        <form action={(fd) => start(() => createClientAction(fd))} className="space-y-6">
          <ClientFields />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Criando..." : "Criar cliente"}
          </Button>
        </form>
      </Modal>
    </>
  );
}

export function EditClientForm({ client, onDone }: { client: Client; onDone?: () => void }) {
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) =>
        start(async () => {
          await updateClientAction(client.id, fd);
          onDone?.();
        })
      }
      className="space-y-6"
    >
      <ClientFields client={client} />
      <Button type="submit" tone="blue" className="w-full" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="card max-h-[90dvh] w-full overflow-y-auto rounded-b-none p-6 sm:max-w-lg sm:rounded-b-[1.25rem]"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black">{title}</h2>
              <button onClick={onClose} className="rounded-xl p-1.5 text-muted hover:bg-surface-2" aria-label="Fechar">
                <X strokeWidth={3} className="size-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
