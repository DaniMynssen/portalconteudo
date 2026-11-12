"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Check, RotateCcw } from "lucide-react";
import { decideApproval } from "@/app/actions/contents";
import { Button } from "./ui";
import { Mascot } from "./mascot";

export function celebrate() {
  const colors = ["#45c206", "#1cb0f6", "#ffc800", "#ff5aa5", "#a463f2", "#ff9600"];
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors });
  setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 }, colors }), 200);
  setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 }, colors }), 350);
}

export function ApprovalBox({ contentId, isAdmin, whatToApprove }: { contentId: string; isAdmin: boolean; whatToApprove: string }) {
  const [mode, setMode] = useState<"idle" | "ajuste" | "done">("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function decide(decision: "aprovado" | "ajuste") {
    setError(null);
    start(async () => {
      const r = await decideApproval(contentId, decision, decision === "ajuste" ? text : undefined);
      if (!r.ok) return setError(r.message ?? "Erro");
      if (decision === "aprovado") celebrate();
      setMode("done");
    });
  }

  return (
    <AnimatePresence mode="wait">
      {mode === "done" ? (
        <motion.div key="done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card flex items-center gap-4 border-green bg-green-soft p-5">
          <Mascot mood="party" size={72} />
          <div>
            <p className="text-xl font-black text-green-dark">Mandou bem!</p>
            <p className="font-bold">Sua resposta foi registrada. A gente segue daqui.</p>
          </div>
        </motion.div>
      ) : (
        <motion.div key="box" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card-pop border-yellow bg-yellow-soft p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Mascot mood="waiting" size={72} className="hidden sm:block" />
            <div className="flex-1">
              <p className="text-xl font-black">{isAdmin ? "Aguardando o cliente" : "Bora aprovar?"}</p>
              <p className="font-bold text-muted">
                {isAdmin ? "O cliente precisa aprovar " : "Dá uma olhada e aprova "}
                {whatToApprove}.{isAdmin && " Você também pode registrar a decisão por ele."}
              </p>
            </div>
          </div>

          {mode === "ajuste" ? (
            <div className="mt-4 space-y-2">
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="O que precisa mudar?"
                className="field bg-surface"
              />
              <div className="flex flex-wrap gap-2">
                <Button tone="orange" disabled={!text.trim() || pending} onClick={() => decide("ajuste")}>
                  Enviar ajuste
                </Button>
                <Button variant="ghost" onClick={() => setMode("idle")}>
                  Voltar
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
              <Button size="lg" disabled={pending} onClick={() => decide("aprovado")}>
                <Check className="size-5" strokeWidth={4} /> Aprovar
              </Button>
              <Button size="lg" tone="orange" disabled={pending} onClick={() => setMode("ajuste")}>
                <RotateCcw className="size-5" strokeWidth={3} /> Ajustar
              </Button>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-dark">{error}</p>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
