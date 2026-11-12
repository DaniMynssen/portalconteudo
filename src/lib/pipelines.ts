// Fluxos de etapas por formato. Espelha public.pipeline_steps() no banco —
// se mudar aqui, crie uma migration atualizando a função também.

export type Platform = "youtube" | "instagram";
export type Format = "video" | "reels" | "carrossel" | "post" | "stories";
export type MediaKind = "thumbnail" | "capa" | "slide" | "arte";

export type StatusKey =
  | "ideia"
  | "titulo_thumb"
  | "aprovacao"
  | "roteiro"
  | "copy"
  | "design"
  | "producao"
  | "gravar"
  | "editar"
  | "metadados"
  | "legenda"
  | "agendado"
  | "postado";

export type Tone = "gray" | "blue" | "purple" | "orange" | "pink" | "green" | "yellow" | "red";

export const STATUS: Record<StatusKey, { label: string; tone: Tone }> = {
  ideia: { label: "Ideia", tone: "gray" },
  titulo_thumb: { label: "Título & Thumb", tone: "purple" },
  aprovacao: { label: "Aprovação", tone: "yellow" },
  roteiro: { label: "Roteiro", tone: "blue" },
  copy: { label: "Copy", tone: "blue" },
  design: { label: "Design", tone: "purple" },
  producao: { label: "Produção", tone: "purple" },
  gravar: { label: "Gravar", tone: "pink" },
  editar: { label: "Editar", tone: "orange" },
  metadados: { label: "Metadados", tone: "blue" },
  legenda: { label: "Legenda", tone: "blue" },
  agendado: { label: "Agendado", tone: "green" },
  postado: { label: "Postado", tone: "green" },
};

export const PIPELINES: Record<Format, StatusKey[]> = {
  video: ["ideia", "titulo_thumb", "aprovacao", "roteiro", "gravar", "editar", "metadados", "agendado", "postado"],
  reels: ["ideia", "roteiro", "aprovacao", "gravar", "editar", "legenda", "agendado", "postado"],
  carrossel: ["ideia", "copy", "design", "aprovacao", "legenda", "agendado", "postado"],
  post: ["ideia", "copy", "design", "aprovacao", "legenda", "agendado", "postado"],
  stories: ["ideia", "producao", "aprovacao", "postado"],
};

export const PLATFORMS: Record<Platform, { label: string; formats: Format[] }> = {
  youtube: { label: "YouTube", formats: ["video"] },
  instagram: { label: "Instagram", formats: ["reels", "carrossel", "post", "stories"] },
};

export const FORMATS: Record<
  Format,
  { label: string; platform: Platform; media: MediaKind; aspect: string; mediaLabel: string; scriptLabel: string }
> = {
  video: { label: "Vídeo", platform: "youtube", media: "thumbnail", aspect: "16/9", mediaLabel: "Thumbnails", scriptLabel: "Roteiro" },
  reels: { label: "Reels", platform: "instagram", media: "capa", aspect: "9/16", mediaLabel: "Capas", scriptLabel: "Roteiro" },
  carrossel: { label: "Carrossel", platform: "instagram", media: "slide", aspect: "4/5", mediaLabel: "Slides", scriptLabel: "Copy dos slides" },
  post: { label: "Post", platform: "instagram", media: "arte", aspect: "4/5", mediaLabel: "Artes", scriptLabel: "Copy" },
  stories: { label: "Stories", platform: "instagram", media: "arte", aspect: "9/16", mediaLabel: "Artes", scriptLabel: "Roteiro" },
};

export function pipelineFor(format: Format) {
  return PIPELINES[format];
}

export function stepIndex(format: Format, status: string) {
  return PIPELINES[format].indexOf(status as StatusKey);
}

export function progressOf(format: Format, status: string) {
  const steps = PIPELINES[format];
  const i = steps.indexOf(status as StatusKey);
  if (i < 0) return 0;
  return i / (steps.length - 1);
}

/** Conteúdo "pronto" para a semana: agendado ou postado. */
export function isDone(status: string) {
  return status === "agendado" || status === "postado";
}

/** Ao trocar de formato, mantém a etapa se existir no novo fluxo; senão volta para "ideia". */
export function coerceStatus(format: Format, status: string): StatusKey {
  return PIPELINES[format].includes(status as StatusKey) ? (status as StatusKey) : "ideia";
}

export const SUGGESTION_STATUS = {
  nova: { label: "Nova", tone: "blue" as Tone },
  em_analise: { label: "Em análise", tone: "yellow" as Tone },
  aceita: { label: "Aceita", tone: "green" as Tone },
  recusada: { label: "Não foi dessa vez", tone: "gray" as Tone },
};
export type SuggestionStatus = keyof typeof SUGGESTION_STATUS;
