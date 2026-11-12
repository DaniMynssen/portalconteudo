"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Highlight } from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Bold, Heading1, Heading2, Highlighter, Italic, List, ListOrdered, Quote, Undo2, Redo2 } from "lucide-react";
import { cn } from "@/lib/utils";

function ToolbarButton({ onClick, active, children, label }: { onClick: () => void; active?: boolean; children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn("grid size-9 place-items-center rounded-xl transition-colors", active ? "bg-blue-soft text-blue-dark" : "text-muted hover:bg-surface-2")}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      ul: e.isActive("bulletList"),
      ol: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      mark: e.isActive("highlight"),
    }),
  });
  const c = () => editor.chain().focus();
  const I = "size-[18px]";
  return (
    <div className="sticky top-0 z-10 flex flex-wrap gap-0.5 border-b-2 border-border bg-surface px-2 py-1.5">
      <ToolbarButton label="Título" active={s.h1} onClick={() => c().toggleHeading({ level: 1 }).run()}><Heading1 className={I} strokeWidth={2.5} /></ToolbarButton>
      <ToolbarButton label="Subtítulo" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}><Heading2 className={I} strokeWidth={2.5} /></ToolbarButton>
      <ToolbarButton label="Negrito" active={s.bold} onClick={() => c().toggleBold().run()}><Bold className={I} strokeWidth={3} /></ToolbarButton>
      <ToolbarButton label="Itálico" active={s.italic} onClick={() => c().toggleItalic().run()}><Italic className={I} strokeWidth={2.5} /></ToolbarButton>
      <ToolbarButton label="Marca-texto" active={s.mark} onClick={() => c().toggleHighlight().run()}><Highlighter className={I} strokeWidth={2.5} /></ToolbarButton>
      <ToolbarButton label="Lista" active={s.ul} onClick={() => c().toggleBulletList().run()}><List className={I} strokeWidth={2.5} /></ToolbarButton>
      <ToolbarButton label="Lista numerada" active={s.ol} onClick={() => c().toggleOrderedList().run()}><ListOrdered className={I} strokeWidth={2.5} /></ToolbarButton>
      <ToolbarButton label="Citação / fala" active={s.quote} onClick={() => c().toggleBlockquote().run()}><Quote className={I} strokeWidth={2.5} /></ToolbarButton>
      <span className="flex-1" />
      <ToolbarButton label="Desfazer" onClick={() => c().undo().run()}><Undo2 className={I} strokeWidth={2.5} /></ToolbarButton>
      <ToolbarButton label="Refazer" onClick={() => c().redo().run()}><Redo2 className={I} strokeWidth={2.5} /></ToolbarButton>
    </div>
  );
}

/** Se o roteiro antigo for texto puro (ex.: importado), converte quebras de linha em parágrafos. */
function toHtml(value: string) {
  if (!value) return "";
  if (/^\s*</.test(value)) return value;
  return value
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function ScriptEditor({
  value,
  editable,
  placeholder,
  onSave,
}: {
  value: string;
  editable: boolean;
  placeholder?: string;
  onSave?: (html: string) => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [StarterKit, Highlight, Placeholder.configure({ placeholder: placeholder ?? "Comece a escrever..." })],
    content: toHtml(value),
    onUpdate: ({ editor }) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => onSave?.(editor.isEmpty ? "" : editor.getHTML()), 1000);
    },
  });

  // salva ao sair da página
  useEffect(
    () => () => {
      if (timer.current && editor) {
        clearTimeout(timer.current);
        onSave?.(editor.isEmpty ? "" : editor.getHTML());
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor],
  );

  if (!editor) return <div className="card min-h-[360px] animate-pulse" />;

  return (
    <div className="card overflow-hidden">
      {editable && <Toolbar editor={editor} />}
      <div className="prose-script px-5 py-4 text-[16px] sm:px-8 sm:py-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
