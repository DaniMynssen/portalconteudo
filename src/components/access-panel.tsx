"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Link2, Mail, Settings, UserMinus } from "lucide-react";
import type { Client, Profile } from "@/lib/types";
import { generateAccessLink, inviteClientUser, removeClientUser } from "@/app/actions/clients";
import { Avatar, Button, Label, SectionTitle } from "./ui";
import { EditClientForm, Modal } from "./client-form";

export function AccessPanel({ client, users }: { client: Client; users: Profile[] }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section>
        <SectionTitle>Quem acessa o portal</SectionTitle>
        <div className="space-y-2">
          {users.length ? (
            users.map((u) => (
              <div key={u.id} className="card flex items-center gap-3 p-3">
                <Avatar name={u.full_name || u.email || "?"} color={client.color} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold">{u.full_name}</p>
                  <p className="truncate text-sm text-muted">{u.email}</p>
                </div>
                <button
                  onClick={() => confirm(`Remover o acesso de ${u.email}?`) && start(() => removeClientUser(u.id))}
                  className="rounded-xl p-2 text-muted hover:bg-red-soft hover:text-red"
                  title="Remover acesso"
                >
                  <UserMinus className="size-5" strokeWidth={2.5} />
                </button>
              </div>
            ))
          ) : (
            <p className="card p-4 text-muted">Ninguém tem acesso ainda. Convide o cliente ao lado.</p>
          )}
        </div>

        <button onClick={() => setEditing(true)} className="mt-6 flex items-center gap-2 text-sm font-extrabold uppercase text-blue">
          <Settings className="size-4" strokeWidth={3} /> Editar dados do cliente
        </button>
        <Modal open={editing} onClose={() => setEditing(false)} title="Editar cliente">
          <EditClientForm client={client} onDone={() => setEditing(false)} />
        </Modal>
      </section>

      <section className="card p-5">
        <SectionTitle>Dar acesso</SectionTitle>
        <Label>E-mail do cliente</Label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="cliente@email.com"
          className="field mb-3"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            tone="blue"
            disabled={!email || pending}
            onClick={() =>
              start(async () => {
                setLink(null);
                const r = await inviteClientUser(client.id, email);
                setMsg({ ok: r.ok, text: r.message });
              })
            }
          >
            <Mail className="size-4" strokeWidth={3} /> Convidar por e-mail
          </Button>
          <Button
            tone="purple"
            disabled={!email || pending}
            onClick={() =>
              start(async () => {
                const r = await generateAccessLink(client.id, email);
                setMsg({ ok: r.ok, text: r.message });
                setLink(r.link);
                setCopied(false);
              })
            }
          >
            <Link2 className="size-4" strokeWidth={3} /> Gerar link
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted">
          O link serve para mandar por WhatsApp. Depois do primeiro acesso, o cliente entra sempre pelo login com o próprio e-mail.
        </p>
        {msg && (
          <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-green-soft text-green-dark" : "bg-red-soft text-red-dark"}`}>
            {msg.text}
          </p>
        )}
        {link && (
          <div className="mt-3 flex gap-2">
            <input readOnly value={link} className="field text-xs" onFocus={(e) => e.target.select()} />
            <Button
              size="sm"
              className="h-auto"
              onClick={() => {
                navigator.clipboard.writeText(link);
                setCopied(true);
              }}
            >
              {copied ? <Check className="size-4" strokeWidth={3} /> : <Copy className="size-4" strokeWidth={3} />}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
