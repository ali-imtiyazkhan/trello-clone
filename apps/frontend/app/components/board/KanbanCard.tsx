"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { MessageSquare, X } from "lucide-react";
import type { Issue } from "../../../lib/types/board";

type KanbanCardProps = {
  issue: Issue;
  onOpen: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
  isDragging?: boolean;
};

export function KanbanCardContent({
  issue,
  onOpen,
  onDelete,
  isDragging,
}: KanbanCardProps) {
  return (
    <div
      onClick={() => !isDragging && onOpen(issue)}
      className={`group cursor-pointer rounded-xl border bg-[#1e1e1e] p-3.5 transition-all duration-200 ${
        isDragging
          ? "border-[#7b39fc]/50 shadow-[0_12px_40px_rgba(123,57,252,0.25)] rotate-[2deg] scale-[1.02]"
          : "border-white/[0.06] hover:border-[#7b39fc]/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="break-words text-sm font-medium text-white/90 group-hover:text-white">
          {issue.title}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(issue);
          }}
          className="hidden shrink-0 rounded p-0.5 text-white/30 transition-colors group-hover:block hover:bg-red-400/10 hover:text-red-400"
          title="Delete card"
        >
          <X size={13} />
        </button>
      </div>

      {issue.description && (
        <p className="mt-1.5 line-clamp-2 text-xs text-white/40">
          {issue.description}
        </p>
      )}

      {(issue.requiredSkills ?? []).length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {issue.requiredSkills.slice(0, 2).map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-[#7b39fc]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#a87aff]"
            >
              {skill}
            </span>
          ))}
          {issue.requiredSkills.length > 2 && (
            <span className="text-[10px] text-white/30">
              +{issue.requiredSkills.length - 2}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between pt-1">
        <div className="flex -space-x-1.5">
          {issue.assignees.map(({ user }) => (
            <span
              key={user.id}
              title={user.username}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7b39fc] text-[9px] font-semibold text-white ring-2 ring-[#1e1e1e]"
            >
              {user.username.slice(0, 1).toUpperCase()}
            </span>
          ))}
        </div>
        {issue._count?.comments ? (
          <div className="flex items-center gap-1 text-[11px] text-white/40">
            <MessageSquare size={12} />
            <span>{issue._count.comments}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function DraggableKanbanCard(props: KanbanCardProps & { issue: Issue }) {
  const { issue } = props;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: issue.id,
      data: { issue, sectionId: issue.sectionId },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? "opacity-40" : undefined}
    >
      <KanbanCardContent {...props} isDragging={isDragging} />
    </div>
  );
}
