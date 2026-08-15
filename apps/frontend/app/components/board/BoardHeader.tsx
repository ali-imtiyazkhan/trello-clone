"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { ActiveUser } from "../../../lib/types/board";

type BoardHeaderProps = {
  boardTitle: string;
  editingBoardTitle: boolean;
  boardTitleInput: string;
  onBoardTitleInputChange: (value: string) => void;
  onStartRename: () => void;
  onSaveTitle: () => void;
  onDeleteBoard: () => void;
  connected: boolean;
  activeUsers: ActiveUser[];
};

export function BoardHeader({
  boardTitle,
  editingBoardTitle,
  boardTitleInput,
  onBoardTitleInputChange,
  onStartRename,
  onSaveTitle,
  onDeleteBoard,
  connected,
  activeUsers,
}: BoardHeaderProps) {
  return (
    <div className="glass-strong border-b border-white/10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3.5 lg:px-8">
        <div className="flex items-center gap-4">
          {editingBoardTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={boardTitleInput}
                onChange={(e) => onBoardTitleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveTitle();
                }}
                autoFocus
                className="rounded-xl border border-[#7b39fc]/40 bg-black px-3 py-1.5 text-lg font-bold text-white outline-none focus:ring-2 focus:ring-[#7b39fc]/30"
              />
              <button
                type="button"
                onClick={onSaveTitle}
                className="rounded-xl bg-[#7b39fc] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#8d53ff]"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="font-[family-name:var(--font-manrope)] text-lg font-bold tracking-tight text-white">
                {boardTitle}
              </h1>
              <button
                type="button"
                onClick={onStartRename}
                className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white"
                title="Rename board"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={onDeleteBoard}
                className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-red-400/10 hover:text-red-400"
                title="Delete board"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#1a1a1a] px-3 py-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                connected
                  ? "animate-pulse bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  : "bg-white/20"
              }`}
            />
            <span className="font-medium text-white/60">
              {connected
                ? activeUsers.length > 0
                  ? `${activeUsers.length} online`
                  : "Connected"
                : "Offline"}
            </span>
          </div>

          {activeUsers.length > 0 && (
            <div className="flex -space-x-2">
              {activeUsers.slice(0, 4).map((u, i) => (
                <div
                  key={u.userId || i}
                  title={u.username || "anonymous"}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7b39fc] text-[10px] font-semibold text-white ring-2 ring-black"
                >
                  {(u.username || "?").slice(0, 1).toUpperCase()}
                </div>
              ))}
              {activeUsers.length > 4 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2a2a] text-[10px] font-medium text-white/60 ring-2 ring-black">
                  +{activeUsers.length - 4}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
