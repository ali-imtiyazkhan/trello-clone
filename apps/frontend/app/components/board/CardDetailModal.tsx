"use client";

import { Check, Users, X, Zap } from "lucide-react";
import type {
  Candidate,
  Comment,
  Issue,
  Member,
} from "../../../lib/types/board";
import { Modal } from "../ui/modal";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

type CardDetailModalProps = {
  issue: Issue | null;
  onClose: () => void;
  issueTitle: string;
  onIssueTitleChange: (value: string) => void;
  issueDescription: string;
  onIssueDescriptionChange: (value: string) => void;
  onSave: () => void;
  savingIssue: boolean;
  members: Member[];
  meId: string;
  showMembers: boolean;
  onToggleMembers: () => void;
  isAssigned: (userId: string) => boolean;
  onToggleAssignee: (member: Member) => void;
  onRemoveSkill: (skill: string) => void;
  onSuggest: () => void;
  suggesting: boolean;
  suggestOpen: boolean;
  suggestions: Candidate[];
  onAssignCandidate: (candidate: Candidate) => void;
  comments: Comment[];
  commentText: string;
  onCommentTextChange: (value: string) => void;
  onAddComment: (e: React.FormEvent<HTMLFormElement>) => void;
  onDeleteComment: (comment: Comment) => void;
  savingComment: boolean;
};

export function CardDetailModal({
  issue,
  onClose,
  issueTitle,
  onIssueTitleChange,
  issueDescription,
  onIssueDescriptionChange,
  onSave,
  savingIssue,
  members,
  meId,
  showMembers,
  onToggleMembers,
  isAssigned,
  onToggleAssignee,
  onRemoveSkill,
  onSuggest,
  suggesting,
  suggestOpen,
  suggestions,
  onAssignCandidate,
  comments,
  commentText,
  onCommentTextChange,
  onAddComment,
  onDeleteComment,
  savingComment,
}: CardDetailModalProps) {
  if (!issue) return null;

  return (
    <Modal open={!!issue} onClose={onClose} title="Card Details" size="lg">
      <div className="space-y-5">
        <Input
          label="Title"
          value={issueTitle}
          onChange={(e) => onIssueTitleChange(e.target.value)}
          className="h-11 px-4 font-medium"
        />

        <Textarea
          label="Description"
          value={issueDescription}
          onChange={(e) => onIssueDescriptionChange(e.target.value)}
          rows={3}
          placeholder="Add a detailed description..."
        />

        <Button variant="white" onClick={onSave} loading={savingIssue}>
          {savingIssue ? "Saving..." : "Save changes"}
        </Button>

        <div className="space-y-2 border-t border-white/[0.06] pt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Assignees
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {issue.assignees.map(({ user }) => (
              <span
                key={user.id}
                onClick={() => onToggleAssignee({ user } as Member)}
                className="group flex cursor-pointer items-center gap-1.5 rounded-full bg-[#7b39fc]/15 px-3 py-1 text-xs font-medium text-[#a87aff] transition-colors hover:bg-red-400/10 hover:text-red-400"
                title={`Click to remove ${user.username}`}
              >
                {user.username}
                <X size={12} className="opacity-60 group-hover:opacity-100" />
              </span>
            ))}
            {issue.assignees.length === 0 && (
              <span className="text-xs text-white/30">No assignees yet</span>
            )}
            <button
              type="button"
              onClick={onToggleMembers}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
            >
              <Users size={12} />
              {showMembers ? "Close" : "+ Assign"}
            </button>
          </div>

          {showMembers && (
            <div className="mt-2 divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/10 bg-black/60">
              {members.map((member) => (
                <button
                  key={member.user.id}
                  type="button"
                  onClick={() => onToggleAssignee(member)}
                  className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-white/[0.04]"
                >
                  <span className="font-medium text-white">
                    {member.user.username}
                    {member.user.id === meId && (
                      <span className="ml-1.5 text-white/40">(you)</span>
                    )}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-[11px] font-semibold ${
                      isAssigned(member.user.id)
                        ? "text-[#7b39fc]"
                        : "text-white/40"
                    }`}
                  >
                    {isAssigned(member.user.id) ? (
                      <>
                        <Check size={12} /> Assigned
                      </>
                    ) : (
                      "Assign"
                    )}
                  </span>
                </button>
              ))}
              {members.length === 0 && (
                <p className="px-3.5 py-2.5 text-xs text-white/30">
                  No organization members found
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-white/[0.06] pt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Required skills
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {(issue.requiredSkills ?? []).map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black px-2.5 py-1 text-xs text-white/90"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => onRemoveSkill(skill)}
                  className="text-white/30 transition-colors hover:text-red-400"
                  title="Remove skill"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {(issue.requiredSkills ?? []).length === 0 && (
              <span className="text-xs text-white/30">
                Auto-extracted from title & description
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onSuggest}
            disabled={suggesting}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7b39fc] to-[#9d6aff] py-2.5 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(123,57,252,0.3)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            <Zap size={14} />
            {suggesting ? "Scoring members..." : "Suggest Assignee (AI Match)"}
          </button>

          {suggestOpen && suggestions.length > 0 && (
            <div className="mt-3 divide-y divide-white/[0.06] rounded-xl border border-white/10 bg-black/60">
              {suggestions.map((c, i) => (
                <div
                  key={c.userId}
                  className="flex items-center gap-3 p-3 text-xs"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/60">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-white">
                        {c.username}
                      </span>
                      <span className="text-[11px] text-white/40">
                        score:{" "}
                        <strong className="text-white">{c.score}</strong> ·
                        precision: {Math.round(c.precision * 100)}%
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {c.matchedSkills.map((m) => (
                        <span
                          key={m.skill}
                          className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400"
                        >
                          {m.skill} {Math.round(m.strength * 100)}%
                        </span>
                      ))}
                      {c.missingSkills.map((m) => (
                        <span
                          key={m}
                          className="rounded bg-red-400/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400"
                        >
                          missing: {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  {isAssigned(c.userId) ? (
                    <span className="shrink-0 font-medium text-[#7b39fc]">
                      ✓ Assigned
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAssignCandidate(c)}
                      className="shrink-0 rounded-lg bg-white px-3 py-1 text-xs font-semibold text-black transition-colors hover:bg-white/90"
                    >
                      Assign
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {suggestOpen && suggestions.length === 0 && (
            <p className="mt-2 text-center text-xs text-white/30">
              No member matched the required skills yet.
            </p>
          )}
        </div>

        <div className="space-y-3 border-t border-white/[0.06] pt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Comments ({comments.length})
          </label>
          <ul className="space-y-2.5">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded-xl border border-white/[0.06] bg-black/40 p-3"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/80">
                    {comment.user.username}
                    {comment.user.id === meId && (
                      <span className="ml-1.5 font-normal text-white/30">
                        (you)
                      </span>
                    )}
                  </span>
                  {comment.user.id === meId && (
                    <button
                      type="button"
                      onClick={() => onDeleteComment(comment)}
                      className="text-xs text-white/30 transition-colors hover:text-red-400"
                      title="Delete comment"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="break-words text-xs text-white/70">
                  {comment.content}
                </p>
              </li>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-white/30">No comments yet</p>
            )}
          </ul>

          <form onSubmit={onAddComment} className="flex gap-2 pt-1">
            <Input
              value={commentText}
              onChange={(e) => onCommentTextChange(e.target.value)}
              placeholder="Write a comment..."
              className="h-10 px-3.5 text-xs"
            />
            <Button
              type="submit"
              variant="white"
              className="px-4 text-xs"
              loading={savingComment}
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
