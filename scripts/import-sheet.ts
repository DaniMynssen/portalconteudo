/**
 * Importa a planilha antiga (CSV) para o Pauta.
 *
 * Uso:
 *   npx tsx scripts/import-sheet.ts --arquivo scripts/exemplos/brunno-moleta-novembro.csv --cliente "Brunno Moleta"
 *
 * Opções:
 *   --arquivo   CSV exportado do Google Sheets (Arquivo > Fazer download > CSV)
 *   --cliente   Nome do cliente (cria se não existir)
 *   --formato   video | reels | carrossel | post | stories   (padrão: video)
 *   --simular   Só mostra o que seria importado, sem gravar
 *
 * Colunas reconhecidas (cabeçalho, sem diferenciar maiúsculas/acentos):
 *   Dia/Data, Título, Status, Observação. Linhas sem título são ignoradas.
 * Lê NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do .env.local.
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { coerceStatus, FORMATS, type Format, type StatusKey } from "../src/lib/pipelines";

function loadEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
  }
}

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return undefined;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : "true";
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const STATUS_MAP: Record<string, StatusKey> = {
  ideia: "ideia",
  "titulo e thumbnail": "titulo_thumb",
  "titulo & thumb": "titulo_thumb",
  aprovacao: "aprovacao",
  roteiro: "roteiro",
  roteirizar: "roteiro",
  gravar: "gravar",
  gravado: "editar",
  editar: "editar",
  editando: "editar",
  editado: "metadados",
  metadados: "metadados",
  legenda: "legenda",
  agendar: "agendado",
  agendado: "agendado",
  postar: "agendado",
  postado: "postado",
  publicado: "postado",
};

function toISO(d: string) {
  const m = d.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const year = m[3]!.length === 2 ? `20${m[3]}` : m[3]!;
  return `${year}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
}

function slugify(s: string) {
  return norm(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  loadEnv();
  const file = arg("arquivo");
  const clientName = arg("cliente");
  const format = (arg("formato") ?? "video") as Format;
  const dryRun = arg("simular") === "true";
  if (!file || !clientName) {
    console.error('Uso: npx tsx scripts/import-sheet.ts --arquivo planilha.csv --cliente "Nome do Cliente" [--formato video] [--simular]');
    process.exit(1);
  }
  if (!(format in FORMATS)) throw new Error(`Formato inválido: ${format}`);

  const rows = parseCsv(readFileSync(file, "utf8"));
  const headerIdx = rows.findIndex((r) => r.some((c) => ["titulo", "título"].includes(norm(c))));
  if (headerIdx < 0) throw new Error("Não achei a linha de cabeçalho com a coluna 'Título'");
  const header = rows[headerIdx]!.map(norm);
  const col = (...names: string[]) => header.findIndex((h) => names.includes(h));
  const iDate = col("dia", "data");
  const iTitle = col("titulo");
  const iStatus = col("status");
  const iNotes = col("observacao", "observacoes", "obs");

  const items = rows
    .slice(headerIdx + 1)
    .map((r) => {
      const title = r[iTitle]?.trim() ?? "";
      const rawStatus = iStatus >= 0 ? norm(r[iStatus] ?? "") : "";
      return {
        title,
        publish_date: iDate >= 0 ? toISO(r[iDate] ?? "") : null,
        status: coerceStatus(format, STATUS_MAP[rawStatus] ?? "ideia"),
        notes: iNotes >= 0 ? (r[iNotes]?.trim() ?? "") : "",
        rawStatus,
      };
    })
    .filter((i) => i.title);

  console.log(`\n${items.length} conteúdos encontrados em ${file}:\n`);
  for (const i of items) {
    console.log(`  ${i.publish_date ?? "sem data  "}  ${i.status.padEnd(12)}  ${i.title}`);
    if (i.rawStatus && !STATUS_MAP[i.rawStatus]) console.log(`    ⚠ status "${i.rawStatus}" não reconhecido → ideia`);
  }
  if (dryRun) {
    console.log("\n(simulação — nada foi gravado)\n");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const slug = slugify(clientName);
  let { data: client } = await supabase.from("clients").select("id, name").eq("slug", slug).maybeSingle();
  if (!client) {
    const { data, error } = await supabase.from("clients").insert({ name: clientName, slug }).select("id, name").single();
    if (error) throw error;
    client = data;
    console.log(`\nCliente criado: ${clientName}`);
  }

  // evita duplicar: pula títulos que já existem para o cliente
  const { data: existing } = await supabase.from("contents").select("title").eq("client_id", client.id);
  const have = new Set((existing ?? []).map((e) => norm(e.title)));
  const toInsert = items
    .filter((i) => !have.has(norm(i.title)))
    .map((i) => ({
      client_id: client!.id,
      platform: FORMATS[format].platform,
      format,
      status: i.status,
      publish_date: i.publish_date,
      title: i.title,
      notes: i.notes,
    }));

  if (toInsert.length) {
    const { error } = await supabase.from("contents").insert(toInsert);
    if (error) throw error;
  }
  console.log(`\n✔ ${toInsert.length} importados, ${items.length - toInsert.length} já existiam.\n`);
}

main().catch((e) => {
  console.error("\nErro:", e.message ?? e);
  process.exit(1);
});
