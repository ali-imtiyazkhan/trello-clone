"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Issue, Section } from "../../../lib/types/board";
import { KanbanCardContent } from "./KanbanCard";
import { KanbanColumn } from "./KanbanColumn";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

type KanbanBoardProps = {
  sections: Section[];
  cardTitles: Record<string, string>;
  onCardTitleChange: (sectionId: string, value: string) => void;
  onCreateCard: (e: React.FormEvent<HTMLFormElement>, sectionId: string) => void;
  onOpenCard: (issue: Issue) => void;
  onDeleteCard: (sectionId: string, issue: Issue) => void;
  onMoveCard: (issueId: string, sourceSectionId: string, targetSectionId: string) => void;
  menuSectionId: string | null;
  onToggleMenu: (sectionId: string) => void;
  renamingSectionId: string | null;
  renameTitle: string;
  onRenameTitleChange: (value: string) => void;
  onStartRename: (section: Section) => void;
  onSaveRename: (section: Section) => void;
  onCancelRename: () => void;
  onDeleteSection: (section: Section) => void;
  sectionTitle: string;
  onSectionTitleChange: (value: string) => void;
  onCreateSection: (e: React.FormEvent<HTMLFormElement>) => void;
  creatingSection: boolean;
  header?: ReactNode;
};

export function KanbanBoard({
  sections,
  cardTitles,
  onCardTitleChange,
  onCreateCard,
  onOpenCard,
  onDeleteCard,
  onMoveCard,
  menuSectionId,
  onToggleMenu,
  renamingSectionId,
  renameTitle,
  onRenameTitleChange,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onDeleteSection,
  sectionTitle,
  onSectionTitleChange,
  onCreateSection,
  creatingSection,
  header,
}: KanbanBoardProps) {
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const issue = event.active.data.current?.issue as Issue | undefined;
    if (issue) setActiveIssue(issue);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveIssue(null);
    setDropTargetId(null);

    const issueId = String(event.active.id);
    const sourceSectionId = event.active.data.current?.sectionId as string;
    const targetSectionId = event.over ? String(event.over.id) : null;

    if (!targetSectionId || sourceSectionId === targetSectionId) return;
    onMoveCard(issueId, sourceSectionId, targetSectionId);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(event) => {
        setDropTargetId(event.over ? String(event.over.id) : null);
      }}
    >
      {header}
      <div className="flex items-start gap-5 overflow-x-auto pb-6 snap-x snap-mandatory md:snap-none">
        {sections.map((section) => (
          <div key={section.id} className="snap-center">
            <KanbanColumn
              section={section}
              cardTitle={cardTitles[section.id] ?? ""}
              onCardTitleChange={(v) => onCardTitleChange(section.id, v)}
              onCreateCard={(e) => onCreateCard(e, section.id)}
              onOpenCard={onOpenCard}
              onDeleteCard={(issue) => onDeleteCard(section.id, issue)}
              menuOpen={menuSectionId === section.id}
              onToggleMenu={() => onToggleMenu(section.id)}
              renaming={renamingSectionId === section.id}
              renameTitle={renameTitle}
              onRenameTitleChange={onRenameTitleChange}
              onStartRename={() => onStartRename(section)}
              onSaveRename={() => onSaveRename(section)}
              onCancelRename={onCancelRename}
              onDeleteSection={() => onDeleteSection(section)}
              isDropTarget={dropTargetId === section.id && !!activeIssue}
            />
          </div>
        ))}

        <div className="w-72 shrink-0 snap-center">
          <form
            onSubmit={onCreateSection}
            className="space-y-3 rounded-2xl border border-dashed border-white/10 bg-[#141414]/50 p-4"
          >
            <Input
              value={sectionTitle}
              onChange={(e) => onSectionTitleChange(e.target.value)}
              placeholder="New section title..."
              required
              disabled={creatingSection}
              className="h-10 px-3.5"
            />
            <Button
              type="submit"
              variant="primary"
              loading={creatingSection}
              className="w-full py-2.5 text-xs"
            >
              <Plus size={14} />
              {creatingSection ? "Adding..." : "Add Section"}
            </Button>
          </form>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeIssue ? (
          <KanbanCardContent
            issue={activeIssue}
            onOpen={() => {}}
            onDelete={() => {}}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
