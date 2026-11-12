import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, getISOWeek, getISOWeekYear, parseISO, startOfISOWeek, endOfISOWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function parseDate(d: string) {
  return parseISO(d);
}

export function fmtDate(d: string | null, pattern = "dd/MM") {
  if (!d) return "Sem data";
  return format(parseISO(d), pattern, { locale: ptBR });
}

export function weekKey(d: string) {
  const date = parseISO(d);
  return `${getISOWeekYear(date)}-${String(getISOWeek(date)).padStart(2, "0")}`;
}

export function weekLabel(d: string) {
  const date = parseISO(d);
  const start = startOfISOWeek(date);
  const end = endOfISOWeek(date);
  return {
    number: getISOWeek(date),
    range: `${format(start, "d MMM", { locale: ptBR })} – ${format(end, "d MMM", { locale: ptBR })}`,
  };
}

export function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `há ${Math.floor(diff / 86400)} d`;
  return format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });
}

export function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}
