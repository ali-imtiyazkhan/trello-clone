"use client";

import { useDroppable } from "@dnd-kit/core";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import type { Issue, Section } from "../../../lib/types/board";
import { DraggableKanbanCard } from "./KanbanCard";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

type KanbanColumnProps = {
  section: Section;
  cardTitle: string;
  onCardTitleChange: (value: string) => void;
  onCreateCard: (e: React.FormEvent<HTMLFormElement>) => void;
  onOpenCard: (issue: Issue) => void;
  onDeleteCard: (issue: Issue) => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
  renaming: boolean;
  renameTitle: string;
  onRenameTitleChange: (value: string) => void;
  onStartRename: () => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onDeleteSection: () => void;
  isDropTarget?: boolean;
};

export function KanbanColumn({
  section,
  cardTitle,
  onCardTitleChange,
  onCreateCard,
  onOpenCard,
  onDeleteCard,
  menuOpen,
  onToggleMenu,
  renaming,
  renameTitle,
  onRenameTitleChange,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onDeleteSection,
  isDropTarget,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: section.id });

  const highlighted = isOver || isDropTarget;

  return (
    <div
      ref={setNodeRef}
      className={`flex max-h-[75vh] w-72 shrink-0 flex-col rounded-2xl border p-3.5 transition-all duration-200 ${
        highlighted
          ? "border-[#7b39fc]/50 bg-[#7b39fc]/5 shadow-[0_0_0_1px_rgba(123,57,252,0.2),0_8px_32px_rgba(123,57,252,0.12)]"
          : "border-white/10 bg-[#141414]"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        {renaming ? (
          <input
            type="text"
            value={renameTitle}
            onChange={(e) => onRenameTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveRename();
              if (e.key === "Escape") onCancelRename();
            }}
            autoFocus
            className="flex-1 rounded-lg border border-[#7b39fc]/40 bg-black px-2.5 py-1 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-[#7b39fc]/30"
          />
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate font-[family-name:var(--font-manrope)] text-sm font-semibold text-white">
              {section.title}
            </h3>
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] font-medium text-white/50">
              {section._count.issues}
            </span>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1">
          {renaming ? (
            <Button
              variant="primary"
              className="px-2.5 py-1 text-xs"
              onClick={onSaveRename}
            >
              OK
            </Button>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={onToggleMenu}
                className="rounded-lg p-1 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                title="Section options"
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-20 mt-1.5 w-32 rounded-xl border border-white/10 bg-[#1e1e1e] p-1 shadow-xl">
                  <button
                    type="button"
                    onClick={onStartRename}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    <Pencil size={12} /> Rename
                  </button>
                  <button
                    type="button"
                    onClick={onDeleteSection}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-400/10"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2.5 overflow-y-auto pr-0.5">
        {section.issues.map((issue) => (
          <DraggableKanbanCard
            key={issue.id}
            issue={issue}
            onOpen={onOpenCard}
            onDelete={onDeleteCard}
          />
        ))}
      </div>

      <form onSubmit={onCreateCard} className="mt-3 flex gap-2">
        <Input
          value={cardTitle}
          onChange={(e) => onCardTitleChange(e.target.value)}
          placeholder="Add a card..."
          className="h-9 px-3 text-xs"
        />
        <button
          type="submit"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-black transition-all duration-200 hover:bg-white/90 active:scale-95"
          title="Add card"
        >
          <Plus size={15} />
        </button>
      </form>
    </div>
  );
}
