"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

const API = "http://localhost:3001/api";
const WS_URL = "ws://localhost:8080";

type Assignee = { user: { id: string; username: string; email: string } };

type Issue = {
  id: string;
  title: string;
  description: string | null;
  sectionId: string;
  assignees: Assignee[];
  _count?: { comments: number };
};

type Section = {
  id: string;
  title: string;
  boardId: string;
  issues: Issue[];
  _count: { issues: number };
};

type ActiveUser = { userId: string; username?: string };

function getErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [sections, setSections] = useState<Section[]>([]);
  const [boardTitle, setBoardTitle] = useState("Board");
  const [sectionTitle, setSectionTitle] = useState("");
  const [cardTitles, setCardTitles] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const dragRef = useRef<{ issueId: string; sourceSectionId: string } | null>(
    null
  );

  function send(payload: object) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }

  function emitCardEvent(type: string, card: Issue) {
    send({
      type,
      data: { boardId: id, card, cardId: card?.id },
    });
  }

  const upsertSection = useCallback((section: Section) => {
    setSections((prev) => {
      const exists = prev.some((s) => s.id === section.id);
      if (exists) {
        return prev.map((s) => (s.id === section.id ? section : s));
      }
      return [...prev, section];
    });
  }, []);

  const upsertCard = useCallback((card: Issue) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== card.sectionId) return section;
        const exists = section.issues.some((i) => i.id === card.id);
        if (exists) {
          return {
            ...section,
            issues: section.issues.map((i) =>
              i.id === card.id ? { ...i, ...card } : i
            ),
          };
        }
        return { ...section, issues: [...section.issues, card] };
      })
    );
  }, []);

  const removeCard = useCallback((cardId: string) => {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        issues: section.issues.filter((i) => i.id !== cardId),
      }))
    );
  }, []);

  const loadBoard = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please sign in first");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API}/sections/board/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSections(res.data.sections);

      const orgId = res.data.sections[0]?.board?.organizationId;
      if (orgId) {
        const boardRes = await axios.get(`${API}/boards/${id}`, {
          params: { orgId },
          headers: { Authorization: `Bearer ${token}` },
        });
        setBoardTitle(boardRes.data.board.title);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load board"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let disposed = false;
    let ws: WebSocket | null = null;

    async function connect() {
      let userId = "";
      let username = "";

      try {
        const me = await axios.get(`${API}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        userId = me.data.user.id;
        username = me.data.user.username;
      } catch {
        return;
      }

      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) return;
        setConnected(true);
        if (ws) {
          sendWS(ws, {
            type: "JOIN_ROOM",
            data: { boardId: id, userId, username },
          });
        }
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "ROOM_JOINED":
            setActiveUsers(message.data.activeUsers ?? []);
            break;

          case "USER_JOINED":
            setActiveUsers((prev) => {
              const userId = message.data.userId;
              if (prev.some((u) => u.userId === userId)) return prev;
              return [
                ...prev,
                { userId, username: message.data.username },
              ];
            });
            break;

          case "USER_LEFT":
            setActiveUsers((prev) =>
              prev.filter((u) => u.userId !== message.data.userId)
            );
            break;

          case "SECTION_CREATED":
            upsertSection({
              ...message.data.section,
              issues: [],
              _count: { issues: 0 },
            });
            break;

          case "SECTION_UPDATED":
            setSections((prev) =>
              prev.map((s) =>
                s.id === message.data.section?.id
                  ? { ...s, title: message.data.section.title }
                  : s
              )
            );
            break;

          case "SECTION_DELETED":
            setSections((prev) =>
              prev.filter((s) => s.id !== message.data.sectionId)
            );
            break;

          case "CARD_CREATED":
            upsertCard({
              ...message.data.card,
              assignees: message.data.card.assignees ?? [],
            });
            break;

          case "CARD_UPDATED":
            upsertCard({
              ...message.data.card,
              assignees: message.data.card.assignees ?? [],
            });
            break;

          case "CARD_DELETED":
            removeCard(message.data.cardId);
            break;

          case "CARD_MOVED":
            setSections((prev) => {
              const { issueId, sourceSectionId, targetSectionId } =
                message.data;
              if (sourceSectionId === targetSectionId) return prev;

              let moved: Issue | null = null;
              const next = prev.map((section) => {
                if (section.id !== sourceSectionId) return section;
                moved =
                  section.issues.find((i) => i.id === issueId) ?? null;
                return {
                  ...section,
                  issues: section.issues.filter((i) => i.id !== issueId),
                };
              });

              if (!moved) return prev;

              return next.map((section) =>
                section.id === targetSectionId
                  ? { ...section, issues: [...section.issues, moved!] }
                  : section
              );
            });
            break;
        }
      };

      ws.onclose = () => {
        if (disposed) return;
        setConnected(false);
        setActiveUsers([]);
      };
    }

    connect();

    return () => {
      disposed = true;
      if (ws) {
        sendWS(ws, { type: "LEAVE_ROOM", data: { boardId: id } });
        ws.close();
      }
      wsRef.current = null;
    };
  }, [id, removeCard, upsertCard, upsertSection]);

  function sendWS(ws: WebSocket, payload: object) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  async function handleCreateSection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setCreating(true);

    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(
        `${API}/sections`,
        { title: sectionTitle, boardId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      upsertSection({
        ...res.data.section,
        issues: [],
        _count: { issues: 0 },
      });
      send({
        type: "CREATE_SECTION",
        data: { boardId: id, section: res.data.section },
      });
      setSectionTitle("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create section"));
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateCard(
    e: React.FormEvent<HTMLFormElement>,
    sectionId: string
  ) {
    e.preventDefault();
    setError("");

    const title = cardTitles[sectionId];
    if (!title?.trim()) return;

    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(
        `${API}/issues`,
        { title, sectionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      upsertCard({ ...res.data.issue, assignees: [], _count: { comments: 0 } });
      emitCardEvent("CREATE_CARD", res.data.issue);
      setCardTitles((prev) => ({ ...prev, [sectionId]: "" }));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create card"));
    }
  }

  async function handleDeleteCard(sectionId: string, issue: Issue) {
    if (!window.confirm(`Delete "${issue.title}"?`)) return;
    setError("");

    const token = localStorage.getItem("token");

    try {
      await axios.delete(`${API}/issues/${sectionId}/${issue.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      removeCard(issue.id);
      send({
        type: "DELETE_CARD",
        data: { boardId: id, cardId: issue.id },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete card"));
    }
  }

  async function handleMoveCard(targetSectionId: string) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.sourceSectionId === targetSectionId) return;

    const token = localStorage.getItem("token");

    try {
      await axios.put(
        `${API}/issues/${drag.sourceSectionId}/${drag.issueId}`,
        { sectionId: targetSectionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSections((prev) => {
        let moved: Issue | null = null;
        const next = prev.map((section) => {
          if (section.id !== drag.sourceSectionId) return section;
          moved =
            section.issues.find((i) => i.id === drag.issueId) ?? null;
          return {
            ...section,
            issues: section.issues.filter((i) => i.id !== drag.issueId),
          };
        });
        if (!moved) return prev;
        return next.map((section) =>
          section.id === targetSectionId
            ? { ...section, issues: [...section.issues, moved!] }
            : section
        );
      });
      send({
        type: "MOVE_CARD",
        data: {
          boardId: id,
          userId: undefined,
          issueId: drag.issueId,
          sourceSectionId: drag.sourceSectionId,
          targetSectionId,
        },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to move card"));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-text-secondary">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-text-primary">
              {boardTitle}
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              {connected ? (
                activeUsers.length > 0 ? (
                  <>
                    {activeUsers.length} online:{" "}
                    {activeUsers
                      .map((u) => u.username || "anonymous")
                      .join(", ")}
                  </>
                ) : (
                  "Connected"
                )
              ) : (
                "Offline"
              )}
            </p>
          </div>
          <Link
            href="/boards"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            &larr; Back to boards
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-4 items-start overflow-x-auto pb-4">
          {sections.map((section) => (
            <div
              key={section.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleMoveCard(section.id)}
              className="w-64 shrink-0 bg-surface border border-border rounded-lg p-4 flex flex-col max-h-[70vh]"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-text-primary">
                  {section.title}
                </h3>
                <span className="text-xs text-text-secondary">
                  {section._count.issues} issue
                  {section._count.issues === 1 ? "" : "s"}
                </span>
              </div>

              <div className="space-y-2 overflow-y-auto">
                {section.issues.map((issue) => (
                  <div
                    key={issue.id}
                    draggable
                    onDragStart={(e) => {
                      dragRef.current = {
                        issueId: issue.id,
                        sourceSectionId: section.id,
                      };
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", issue.id);
                    }}
                    onDragEnd={() => {
                      dragRef.current = null;
                    }}
                    className="group bg-background border border-border rounded-md p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-text-primary break-words">
                        {issue.title}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(section.id, issue)}
                        className="hidden group-hover:block text-text-secondary hover:text-red-600 text-xs shrink-0"
                        title="Delete card"
                      >
                        &times;
                      </button>
                    </div>

                    {issue.description && (
                      <p className="mt-1 text-xs text-text-secondary line-clamp-2">
                        {issue.description}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex -space-x-1.5">
                        {issue.assignees.map(({ user }) => (
                          <span
                            key={user.id}
                            title={user.username}
                            className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-medium flex items-center justify-center border-2 border-background"
                          >
                            {user.username.slice(0, 1).toUpperCase()}
                          </span>
                        ))}
                      </div>
                      {issue._count?.comments ? (
                        <span className="text-[11px] text-text-secondary">
                          {issue._count.comments} comment
                          {issue._count.comments === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => handleCreateCard(e, section.id)}
                className="mt-3 flex gap-2"
              >
                <input
                  type="text"
                  value={cardTitles[section.id] ?? ""}
                  onChange={(e) =>
                    setCardTitles((prev) => ({
                      ...prev,
                      [section.id]: e.target.value,
                    }))
                  }
                  placeholder="Add a card"
                  className="flex-1 px-2 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-primary text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                  Add
                </button>
              </form>
            </div>
          ))}
        </div>

        <form onSubmit={handleCreateSection} className="mt-8 flex gap-2">
          <input
            type="text"
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder="Enter section title"
            required
            disabled={creating}
            className="flex-1 max-w-sm px-3 py-2 border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? "Creating..." : "Add section"}
          </button>
        </form>
      </main>
    </div>
  );
}
