"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { DndContext, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { cn, fmtDate } from "@/lib/utils";
import { PIPELINES, STATUS, type Format, type StatusKey } from "@/lib/pipelines";
import type { ContentCard } from "@/lib/types";
import { moveStatus } from "@/app/actions/contents";
import { TONE } from "./ui";

function Card({ item }: { item: ContentCard }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(2deg)` } : undefined}
      className={cn(
        "card-pop cursor-grab touch-none overflow-hidden active:cursor-grabbing",
        isDragging && "relative z-50 shadow-xl",
      )}
    >
      {item.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.cover_url} alt="" className="aspect-video w-full border-b-2 border-border object-cover" />
      )}
      <div className="p-3">
        <p className="text-xs font-extrabold uppercase text-muted">{fmtDate(item.publish_date, "EEE dd/MM")}</p>
        <Link
          href={`/conteudos/${item.id}`}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-0.5 line-clamp-3 text-sm font-extrabold hover:text-blue"
        >
          {item.title || "Sem título"}
        </Link>
      </div>
    </div>
  );
}

function Column({ status, items }: { status: StatusKey; items: ContentCard[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STATUS[status];
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-64 shrink-0 flex-col gap-2.5 rounded-3xl border-2 border-dashed p-2.5 transition-colors",
        isOver ? cn(TONE[meta.tone].border, TONE[meta.tone].soft) : "border-transparent bg-surface-2",
      )}
    >
      <div className="flex items-center gap-2 px-1.5 pt-1">
        <span className={cn("size-3 rounded-full", TONE[meta.tone].bg)} />
        <span className="text-sm font-black uppercase tracking-wide">{meta.label}</span>
        <span className="ml-auto text-xs font-extrabold text-muted">{items.length}</span>
      </div>
      {items.map((it) => (
        <Card key={it.id} item={it} />
      ))}
      {!items.length && <div className="py-6 text-center text-xs font-bold text-muted">Arraste aqui</div>}
    </div>
  );
}

export function Kanban({ items, format }: { items: ContentCard[]; format: Format }) {
  const [list, setList] = useState(items);
  const [, start] = useTransition();
  useEffect(() => setList(items), [items]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  function onDragEnd(e: DragEndEvent) {
    const to = e.over?.id as StatusKey | undefined;
    const id = String(e.active.id);
    if (!to) return;
    const item = list.find((i) => i.id === id);
    if (!item || item.status === to) return;
    setList((l) => l.map((i) => (i.id === id ? { ...i, status: to } : i)));
    start(async () => {
      const r = await moveStatus(id, to);
      if (!r.ok) setList((l) => l.map((i) => (i.id === id ? { ...i, status: item.status } : i)));
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        {PIPELINES[format].map((s) => (
          <Column key={s} status={s} items={list.filter((i) => i.status === s)} />
        ))}
      </div>
    </DndContext>
  );
}
