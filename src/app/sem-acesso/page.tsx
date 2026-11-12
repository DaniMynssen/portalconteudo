import { Mascot } from "@/components/mascot";
import { signOut } from "@/app/actions/auth";

export default function SemAcesso() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="flex max-w-sm flex-col items-center gap-3">
        <Mascot mood="waiting" size={110} />
        <h1 className="text-2xl font-black">Quase lá!</h1>
        <p className="text-muted">
          Sua conta ainda não está ligada a nenhum projeto. Avise quem cuida do seu conteúdo para liberar o acesso.
        </p>
        <form action={signOut}>
          <button className="mt-2 text-sm font-extrabold uppercase text-blue">Sair</button>
        </form>
      </div>
    </main>
  );
}
