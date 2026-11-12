"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { Mascot } from "@/components/mascot";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setState("idle");
      setError(
        error.message.toLowerCase().includes("signups not allowed") || error.status === 422
          ? "Esse e-mail ainda não tem acesso. Peça um convite para quem cuida do seu conteúdo."
          : error.message,
      );
      return;
    }
    setState("sent");
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Mascot mood={state === "sent" ? "party" : "happy"} size={120} />
          <h1 className="mt-3 text-3xl font-black tracking-tight">
            pauta<span className="text-green">.</span>
          </h1>
          <p className="mt-1 text-muted">Seu conteúdo, do roteiro ao post.</p>
        </div>

        <AnimatePresence mode="wait">
          {state === "sent" ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 text-center"
            >
              <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-blue-soft">
                <Mail className="size-7 text-blue" strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black">Olha seu e-mail!</h2>
              <p className="mt-2 text-muted">
                Mandamos um link mágico para <b className="text-ink">{email}</b>. É só clicar para entrar.
              </p>
              <button className="mt-4 text-sm font-extrabold uppercase text-blue" onClick={() => setState("idle")}>
                Usar outro e-mail
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={submit}
              className="space-y-3"
            >
              <input
                type="email"
                required
                autoFocus
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field h-14 text-base"
              />
              {error && <p className="rounded-xl bg-red-soft px-3 py-2 text-sm text-red-dark">{error}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={state === "sending" || !email}>
                {state === "sending" ? "Enviando..." : "Entrar com link mágico"}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
