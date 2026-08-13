"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Header from "../../components/Header";
import RequireAuth from "../../components/RequireAuth";

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

type Member = { user: { id: string; username: string; email: string } };

type Comment = {
  id: string;
  content: string;
  user: { id: string; username: string; email: string };
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
  const router = useRouter();

  const [sections, setSections] = useState<Section[]>([]);
  const [boardTitle, setBoardTitle] = useState("Board");
  const [orgId, setOrgId] = useState("");
  const [sectionTitle, setSectionTitle] = useState("");
  const [cardTitles, setCardTitles] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [meId, setMeId] = useState("");
  const [meUsername, setMeUsername] = useState("");

  // board chat
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<
    { userId?: string; username?: string; message: string; timestamp?: string }[]
  >([]);
  const [chatText, setChatText] = useState("");

  // board management
  const [editingBoardTitle, setEditingBoardTitle] = useState(false);
  const [boardTitleInput, setBoardTitleInput] = useState("");

  // section management
  const [menuSectionId, setMenuSectionId] = useState<string | null>(null);
  const [renamingSectionId, setRenamingSectionId] = useState<string | null>(
    null
  );
  const [renameTitle, setRenameTitle] = useState("");

  // card modal
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [savingIssue, setSavingIssue] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);

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
      data: { boardId: id, card, cardId: card.id },
    });
  }

  function cardPayload(issue: Issue) {
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      sectionId: issue.sectionId,
      assignees: issue.assignees,
      _count: issue._count ?? { comments: 0 },
    };
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
        const issues = exists
          ? section.issues.map((i) =>
              i.id === card.id ? { ...i, ...card } : i
            )
          : [...section.issues, card];
        return { ...section, issues, _count: { issues: issues.length } };
      })
    );
  }, []);

  const removeCard = useCallback((cardId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        const issues = section.issues.filter((i) => i.id !== cardId);
        return { ...section, issues, _count: { issues: issues.length } };
      })
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
        setOrgId(orgId);
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
        if (!disposed) {
          setMeId(userId);
          setMeUsername(username);
        }
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

          case "NEW_MESSAGE":
            setMessages((prev) => [...prev, message.data]);
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
            setSections((prev) => {
              const next = prev.filter(
                (s) => s.id !== message.data.sectionId
              );
              if (selectedIssueRef.current?.sectionId === message.data.sectionId) {
                setSelectedIssue(null);
              }
              return next;
            });
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
            if (selectedIssueRef.current?.id === message.data.cardId) {
              setSelectedIssue(null);
            }
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
                  _count: {
                    issues: section.issues.length - 1,
                  },
                };
              });

              if (!moved) return prev;

              return next.map((section) =>
                section.id === targetSectionId
                  ? {
                      ...section,
                      issues: [...section.issues, moved!],
                      _count: { issues: section.issues.length + 1 },
                    }
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

  function sendChat(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const message = chatText.trim();
    if (!message) return;

    send({
      type: "SEND_MESSAGE",
      data: { boardId: id, userId: meId, username: meUsername, message },
    });
    setChatText("");
  }

  const selectedIssueRef = useRef<Issue | null>(null);

  useEffect(() => {
    selectedIssueRef.current = selectedIssue;
  }, [selectedIssue]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedIssue(null);
        setShowMembers(false);
        setMenuSectionId(null);
        setRenamingSectionId(null);
        setEditingBoardTitle(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ---- section handlers ----

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

  function startRenameSection(section: Section) {
    setRenamingSectionId(section.id);
    setRenameTitle(section.title);
    setMenuSectionId(null);
  }

  async function saveRenameSection(section: Section) {
    const title = renameTitle.trim() || section.title;
    const token = localStorage.getItem("token");

    try {
      const res = await axios.put(
        `${API}/sections/${section.id}`,
        { title, boardId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, title } : s))
      );
      send({
        type: "UPDATE_SECTION",
        data: { boardId: id, section: res.data.section },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to rename section"));
    } finally {
      setRenamingSectionId(null);
    }
  }

  async function handleDeleteSection(section: Section) {
    setMenuSectionId(null);
    if (!window.confirm(`Delete section "${section.title}" and its cards?`))
      return;
    setError("");

    const token = localStorage.getItem("token");

    try {
      await axios.delete(`${API}/sections/${section.id}`, {
        params: { boardId: id },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSections((prev) => prev.filter((s) => s.id !== section.id));
      send({
        type: "DELETE_SECTION",
        data: { boardId: id, sectionId: section.id },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete section"));
    }
  }

  // ---- card handlers ----

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
      setSelectedIssue((prev) => (prev?.id === issue.id ? null : prev));
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
            _count: { issues: section.issues.length - 1 },
          };
        });
        if (!moved) return prev;
        return next.map((section) =>
          section.id === targetSectionId
            ? {
                ...section,
                issues: [...section.issues, moved!],
                _count: { issues: section.issues.length + 1 },
              }
            : section
        );
      });
      send({
        type: "MOVE_CARD",
        data: {
          boardId: id,
          issueId: drag.issueId,
          sourceSectionId: drag.sourceSectionId,
          targetSectionId,
        },
      });
      setSelectedIssue((prev) =>
        prev && prev.id === drag.issueId
          ? { ...prev, sectionId: targetSectionId }
          : prev
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to move card"));
    }
  }

  async function openCard(issue: Issue) {
    setSelectedIssue(issue);
    setIssueTitle(issue.title);
    setIssueDescription(issue.description ?? "");
    setShowMembers(false);
    setComments([]);

    const token = localStorage.getItem("token");
    if (!token) return;

    const { sectionId } = issue;

    if (orgId) {
      try {
        const membersRes = await axios.get(`${API}/orgs/${orgId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMembers(membersRes.data.members ?? []);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load members"));
      }
    }

    try {
      const commentsRes = await axios.get(
        `${API}/issues/${sectionId}/${issue.id}/comments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(commentsRes.data.comments ?? []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load comments"));
    }
  }

  async function saveCard() {
    const issue = selectedIssue;
    if (!issue || savingIssue) return;
    setSavingIssue(true);
    setError("");

    const token = localStorage.getItem("token");
    const title = issueTitle.trim() || issue.title;

    try {
      const res = await axios.put(
        `${API}/issues/${issue.sectionId}/${issue.id}`,
        { title, description: issueDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = {
        ...issue,
        title: res.data.issue.title,
        description: res.data.issue.description,
        _count: issue._count ?? { comments: 0 },
      };
      upsertCard(updated);
      emitCardEvent("UPDATE_CARD", cardPayload(updated));
      setSelectedIssue(updated);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save card"));
    } finally {
      setSavingIssue(false);
    }
  }

  const isAssigned = (userId: string) =>
    selectedIssue?.assignees.some((a) => a.user.id === userId) ?? false;

  async function toggleAssignee(member: Member) {
    const issue = selectedIssue;
    if (!issue) return;
    setError("");

    const token = localStorage.getItem("token");
    const url = `${API}/issues/${issue.sectionId}/${issue.id}/assignees`;

    try {
      if (isAssigned(member.user.id)) {
        await axios.delete(`${url}/${member.user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updated = {
          ...issue,
          assignees: issue.assignees.filter(
            (a) => a.user.id !== member.user.id
          ),
        };
        upsertCard(updated);
        emitCardEvent("UPDATE_CARD", cardPayload(updated));
        setSelectedIssue(updated);
      } else {
        const res = await axios.post(
          url,
          { userId: member.user.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const assignee = res.data.assignee;
        const updated = {
          ...issue,
          assignees: [...issue.assignees, assignee],
        };
        upsertCard(updated);
        emitCardEvent("UPDATE_CARD", cardPayload(updated));
        setSelectedIssue(updated);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update assignees"));
    }
  }

  async function addComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const issue = selectedIssue;
    const content = commentText.trim();
    if (!issue || !content || savingComment) return;
    setSavingComment(true);
    setError("");

    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(
        `${API}/issues/${issue.sectionId}/${issue.id}/comments`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments((prev) => [...prev, res.data.comment]);
      setCommentText("");
      const updated = {
        ...issue,
        _count: { comments: (issue._count?.comments ?? 0) + 1 },
      };
      upsertCard(updated);
      emitCardEvent("UPDATE_CARD", cardPayload(updated));
      setSelectedIssue(updated);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add comment"));
    } finally {
      setSavingComment(false);
    }
  }

  async function deleteComment(comment: Comment) {
    const issue = selectedIssue;
    if (!issue) return;
    if (!window.confirm("Delete this comment?")) return;
    setError("");

    const token = localStorage.getItem("token");

    try {
      await axios.delete(
        `${API}/issues/${issue.sectionId}/${issue.id}/comments/${comment.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      const updated = {
        ...issue,
        _count: { comments: Math.max((issue._count?.comments ?? 0) - 1, 0) },
      };
      upsertCard(updated);
      emitCardEvent("UPDATE_CARD", cardPayload(updated));
      setSelectedIssue(updated);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete comment"));
    }
  }

  // ---- board handlers ----

  function startRenameBoard() {
    setBoardTitleInput(boardTitle);
    setEditingBoardTitle(true);
  }

  async function saveBoardTitle() {
    const title = boardTitleInput.trim() || boardTitle;
    const token = localStorage.getItem("token");

    if (!orgId) {
      setEditingBoardTitle(false);
      return;
    }

    try {
      await axios.put(
        `${API}/boards/${id}`,
        { title, orgId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBoardTitle(title);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to rename board"));
    } finally {
      setEditingBoardTitle(false);
    }
  }

  async function handleDeleteBoard() {
    if (!window.confirm(`Delete board "${boardTitle}" and everything in it?`))
      return;
    setError("");

    const token = localStorage.getItem("token");

    try {
      await axios.delete(`${API}/boards/${id}`, {
        params: { orgId },
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/boards");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete board"));
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
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <Header
          active="boards"
          right={
            <Link
              href="/boards"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              &larr; Boards
            </Link>
          }
        />

        <div className="border-b border-border bg-surface">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            {editingBoardTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={boardTitleInput}
                  onChange={(e) => setBoardTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveBoardTitle();
                  }}
                  autoFocus
                  className="px-2 py-1 text-lg font-semibold border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={saveBoardTitle}
                  className="text-sm bg-primary text-white px-3 py-1 rounded-md font-medium hover:bg-primary-hover transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-text-primary">
                  {boardTitle}
                </h1>
                <button
                  type="button"
                  onClick={startRenameBoard}
                  className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                  title="Rename board"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDeleteBoard}
                  className="text-xs text-text-secondary hover:text-red-600 transition-colors"
                  title="Delete board"
                >
                  Delete
                </button>
              </div>
            )}
            <p className="text-xs text-text-secondary">
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
        </div>

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
              className="w-64 shrink-0 bg-surface border border-border rounded-lg p-3 flex flex-col max-h-[70vh]"
            >
              <div className="flex items-center justify-between mb-3 gap-2">
                {renamingSectionId === section.id ? (
                  <input
                    type="text"
                    value={renameTitle}
                    onChange={(e) => setRenameTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRenameSection(section);
                      if (e.key === "Escape") setRenamingSectionId(null);
                    }}
                    autoFocus
                    className="flex-1 px-2 py-1 text-sm font-medium border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <h3 className="font-medium text-text-primary truncate">
                    {section.title}
                  </h3>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  {renamingSectionId === section.id ? (
                    <button
                      type="button"
                      onClick={() => saveRenameSection(section)}
                      className="text-xs bg-primary text-white px-2 py-1 rounded font-medium hover:bg-primary-hover transition-colors"
                    >
                      OK
                    </button>
                  ) : (
                    <>
                      <span className="text-xs text-text-secondary">
                        {section._count.issues}
                      </span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setMenuSectionId((prev) =>
                              prev === section.id ? null : section.id
                            )
                          }
                          className="text-text-secondary hover:text-text-primary px-1 rounded hover:bg-background transition-colors"
                          title="Section options"
                        >
                          &hellip;
                        </button>
                        {menuSectionId === section.id && (
                          <div className="absolute right-0 mt-1 z-20 bg-surface border border-border rounded-md shadow-sm overflow-hidden">
                            <button
                              type="button"
                              onClick={() => startRenameSection(section)}
                              className="block w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-background transition-colors"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(section)}
                              className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-background transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
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
                    onClick={() => openCard(issue)}
                    className="group bg-background border border-border rounded-md p-3 cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-text-primary break-words">
                        {issue.title}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(section.id, issue);
                        }}
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

      {selectedIssue && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedIssue(null);
            setShowMembers(false);
          }}
        >
          <div
            className="bg-surface border border-border rounded-lg shadow-lg w-full max-w-lg max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 pb-0">
              <h2 className="text-lg font-semibold text-text-primary">
                Card details
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedIssue(null);
                  setShowMembers(false);
                }}
                className="text-text-secondary hover:text-text-primary text-lg leading-none"
                title="Close"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  rows={3}
                  placeholder="Add a more detailed description..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveCard}
                  disabled={savingIssue}
                  className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {savingIssue ? "Saving..." : "Save"}
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Assignees
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedIssue.assignees.map(({ user }) => (
                    <span
                      key={user.id}
                      onClick={() =>
                        toggleAssignee({ user } as Member)
                      }
                      className="cursor-pointer bg-primary/10 text-text-primary text-xs font-medium rounded-full px-2.5 py-1 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title={`Remove ${user.username}`}
                    >
                      {user.username}
                    </span>
                  ))}
                  {selectedIssue.assignees.length === 0 && (
                    <span className="text-xs text-text-secondary">
                      No assignees
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowMembers((v) => !v)}
                    className="text-xs bg-surface border border-border text-text-primary rounded-full px-2.5 py-1 hover:border-primary/50 transition-colors"
                  >
                    + Assign
                  </button>
                </div>

                {showMembers && (
                  <div className="mt-2 border border-border rounded-md bg-background overflow-hidden">
                    {members.map((member) => (
                      <button
                        key={member.user.id}
                        type="button"
                        onClick={() => toggleAssignee(member)}
                        className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface flex items-center justify-between transition-colors"
                      >
                        <span>
                          {member.user.username}
                          {member.user.id === meId && (
                            <span className="ml-1 text-xs text-text-secondary">
                              (you)
                            </span>
                          )}
                        </span>
                        <span
                          className={
                            isAssigned(member.user.id)
                              ? "text-primary"
                              : "text-text-secondary"
                          }
                        >
                          {isAssigned(member.user.id) ? "✓ Assigned" : "Assign"}
                        </span>
                      </button>
                    ))}
                    {members.length === 0 && (
                      <p className="px-3 py-2 text-sm text-text-secondary">
                        No members to assign
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Comments ({comments.length})
                </label>
                <ul className="space-y-2 mb-3">
                  {comments.map((comment) => (
                    <li
                      key={comment.id}
                      className="bg-background border border-border rounded-md p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-text-primary">
                          {comment.user.username}
                          {comment.user.id === meId && (
                            <span className="ml-1 text-text-secondary font-normal">
                              (you)
                            </span>
                          )}
                        </span>
                        {comment.user.id === meId && (
                          <button
                            type="button"
                            onClick={() => deleteComment(comment)}
                            className="text-xs text-text-secondary hover:text-red-600 transition-colors"
                            title="Delete comment"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-text-primary break-words">
                        {comment.content}
                      </p>
                    </li>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-xs text-text-secondary">
                      No comments yet
                    </p>
                  )}
                </ul>
                <form onSubmit={addComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={savingComment}
                    className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                  >
                    {savingComment ? "..." : "Add"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setChatOpen((v) => !v)}
        className={`fixed bottom-4 right-4 z-40 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-colors ${
          chatOpen
            ? "bg-text-secondary text-background hover:opacity-80"
            : "bg-primary text-white hover:bg-primary-hover"
        }`}
      >
        {chatOpen ? "Close chat" : "Board chat"}
      </button>

      {chatOpen && (
        <div className="fixed bottom-16 right-4 z-40 w-80 h-96 bg-surface border border-border rounded-lg shadow-xl flex flex-col">
          <div className="px-4 py-3 border-b border-border font-medium text-sm text-text-primary">
            Board chat
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.userId === meId ? "text-right" : "text-left"
                }
              >
                <span className="text-[11px] text-text-secondary">
                  {m.userId === meId ? "You" : m.username || "Someone"}
                  {m.timestamp &&
                    ` · ${new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
                </span>
                <p
                  className={`inline-block mt-0.5 max-w-[85%] px-3 py-1.5 rounded-lg text-sm break-words ${
                    m.userId === meId
                      ? "bg-primary text-white"
                      : "bg-background border border-border text-text-primary"
                  }`}
                >
                  {m.message}
                </p>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-xs text-text-secondary">
                No messages yet. Say hello!
              </p>
            )}
          </div>

          <form onSubmit={sendChat} className="p-3 border-t border-border flex gap-2">
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Message the board"
              className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="submit"
              className="bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
    </RequireAuth>
  );
}