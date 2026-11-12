"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mascot } from "@/components/mascot";

/**
 * Recebe o retorno do link mágico/convite. Aceita os dois formatos do Supabase:
 *  - ?code=...            (fluxo PKCE, login iniciado neste navegador)
 *  - #access_token=...    (convites e links gerados pelo admin)
 *  - ?token_hash=&type=   (templates de e-mail customizados)
 */
export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.slice(1));
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");
      const hashError = hash.get("error_description") ?? url.searchParams.get("error_description");

      let err: { message: string } | null = null;
      if (hashError) {
        err = { message: hashError };
      } else if (hash.get("access_token") && hash.get("refresh_token")) {
        ({ error: err } = await supabase.auth.setSession({
          access_token: hash.get("access_token")!,
          refresh_token: hash.get("refresh_token")!,
        }));
      } else if (code) {
        ({ error: err } = await supabase.auth.exchangeCodeForSession(code));
      } else if (tokenHash && type) {
        ({ error: err } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "magiclink" }));
      } else {
        err = { message: "Link inválido." };
      }

      if (err) {
        setError(err.message);
        return;
      }
      window.location.replace("/");
    })();
  }, []);

  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <Mascot mood={error ? "waiting" : "happy"} size={110} />
        {error ? (
          <>
            <h1 className="text-xl font-black">Ops, esse link não funcionou</h1>
            <p className="max-w-xs text-muted">Ele pode ter expirado. Peça um novo na tela de login.</p>
            <a href="/login" className="mt-2 text-sm font-extrabold uppercase text-blue">
              Voltar para o login
            </a>
          </>
        ) : (
          <h1 className="text-xl font-black">Entrando...</h1>
        )}
      </div>
    </main>
  );
}
