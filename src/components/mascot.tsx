import { cn } from "@/lib/utils";

/**
 * Pipo — mascote original do Pauta: uma claquete redondinha e simpática.
 * mood: happy (padrão), waiting (olhando de lado), party (comemorando), sleepy (estado vazio)
 */
export function Mascot({
  mood = "happy",
  size = 120,
  className,
}: {
  mood?: "happy" | "waiting" | "party" | "sleepy";
  size?: number;
  className?: string;
}) {
  const eyeY = mood === "sleepy" ? 64 : 60;
  const pupilDx = mood === "waiting" ? 4 : 0;
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={cn("shrink-0", mood === "party" && "animate-bounce", className)}
      aria-hidden
    >
      {/* sombra */}
      <ellipse cx="60" cy="112" rx="34" ry="5" fill="currentColor" opacity=".08" />
      {/* braços */}
      {mood === "party" ? (
        <>
          <path d="M22 70 L8 46" stroke="var(--green-dark)" strokeWidth="9" strokeLinecap="round" />
          <path d="M98 70 L112 46" stroke="var(--green-dark)" strokeWidth="9" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M22 74 L12 88" stroke="var(--green-dark)" strokeWidth="9" strokeLinecap="round" />
          <path d="M98 74 L108 88" stroke="var(--green-dark)" strokeWidth="9" strokeLinecap="round" />
        </>
      )}
      {/* corpo */}
      <rect x="18" y="36" width="84" height="70" rx="26" fill="var(--green-dark)" />
      <rect x="18" y="32" width="84" height="68" rx="26" fill="var(--green)" />
      {/* tampa da claquete */}
      <g transform={mood === "party" ? "rotate(-14 22 30)" : "rotate(-6 22 30)"}>
        <rect x="16" y="14" width="88" height="20" rx="8" fill="#3c3c3c" />
        <path d="M30 14 l10 20 M50 14 l10 20 M70 14 l10 20 M90 14 l8 16" stroke="#fff" strokeWidth="7" />
      </g>
      {/* bochechas */}
      <circle cx="34" cy="76" r="6" fill="var(--pink)" opacity=".55" />
      <circle cx="86" cy="76" r="6" fill="var(--pink)" opacity=".55" />
      {/* olhos */}
      {mood === "sleepy" ? (
        <>
          <path d="M38 64 q7 6 14 0" stroke="#3c3c3c" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M68 64 q7 6 14 0" stroke="#3c3c3c" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="45" cy={eyeY} rx="10" ry="12" fill="#fff" />
          <ellipse cx="75" cy={eyeY} rx="10" ry="12" fill="#fff" />
          <circle cx={47 + pupilDx} cy={eyeY + 2} r="5.5" fill="#3c3c3c" />
          <circle cx={77 + pupilDx} cy={eyeY + 2} r="5.5" fill="#3c3c3c" />
          <circle cx={49 + pupilDx} cy={eyeY - 1} r="1.8" fill="#fff" />
          <circle cx={79 + pupilDx} cy={eyeY - 1} r="1.8" fill="#fff" />
        </>
      )}
      {/* boca */}
      {mood === "party" ? (
        <path d="M48 80 q12 16 24 0 z" fill="#3c3c3c" />
      ) : mood === "waiting" ? (
        <path d="M52 84 h16" stroke="#3c3c3c" strokeWidth="4" strokeLinecap="round" />
      ) : mood === "sleepy" ? (
        <ellipse cx="60" cy="84" rx="4" ry="3" fill="#3c3c3c" />
      ) : (
        <path d="M50 80 q10 10 20 0" stroke="#3c3c3c" strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
      {mood === "party" && (
        <g>
          <circle cx="14" cy="22" r="3" fill="var(--yellow)" />
          <circle cx="108" cy="18" r="3" fill="var(--blue)" />
          <rect x="100" y="34" width="6" height="6" rx="1" fill="var(--pink)" transform="rotate(20 103 37)" />
          <rect x="6" y="36" width="6" height="6" rx="1" fill="var(--purple)" transform="rotate(-20 9 39)" />
        </g>
      )}
    </svg>
  );
}

export function EmptyState({
  title,
  children,
  mood = "sleepy",
  action,
}: {
  title: string;
  children?: React.ReactNode;
  mood?: "happy" | "waiting" | "party" | "sleepy";
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <Mascot mood={mood} size={96} />
      <h3 className="text-lg font-black">{title}</h3>
      {children && <p className="max-w-sm text-muted">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
