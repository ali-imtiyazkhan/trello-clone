"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  MoreHorizontal,
  MessageSquare,
  Sparkles,
  Users,
  Send,
  X,
  Check,
  Zap,
} from "lucide-react";
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
  requiredSkills: string[];
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

type Candidate = {
  userId: string;
  username: string;
  score: number;
  precision: number;
  load: number;
  matchedSkills: { skill: string; strength: number }[];
  missingSkills: string[];
};

function getErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}

export default function BoardDetailPage() {
  const params = useParams();
  const id = params?.id as string;
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
  const [renamingSectionId, setRenamingSectionId] = useState<string | null>(null);
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

  // suggest assignee
  const [suggestions, setSuggestions] = useState<Candidate[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  // toast
  const [toast, setToast] = useState("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const meIdRef = useRef("");

  const wsRef = useRef<WebSocket | null>(null);
  const dragRef = useRef<{ issueId: string; sourceSectionId: string } | null>(null);

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
      requiredSkills: issue.requiredSkills,
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
      const [sectionsRes, boardRes] = await Promise.all([
        axios.get(`${API}/sections/board/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/boards/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setSections(sectionsRes.data.sections ?? []);
      if (boardRes.data.board) {
        setBoardTitle(boardRes.data.board.title);
        setOrgId(boardRes.data.board.organizationId);
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
          meIdRef.current = userId;
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

          case "CARD_ASSIGNED":
            if (message.data.userId !== meIdRef.current) {
              showToast(
                `${message.data.username ?? "Someone"} was assigned to "${
                  message.data.cardTitle ?? "a card"
                }" by skill match${message.data.score != null ? ` (score ${message.data.score})` : ""}`
              );
            }
            break;

          case "PROFILE_UPDATED":
            if (message.data.userId !== meIdRef.current) {
              showToast(
                `${message.data.username ?? "Someone"} updated their skill profile`
              );
            }
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
    setSuggestions([]);
    setSuggestOpen(false);

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

  async function suggestAssignees() {
    const issue = selectedIssue;
    if (!issue || suggesting) return;
    setSuggesting(true);
    setError("");
    setSuggestOpen(true);

    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(
        `${API}/issues/${issue.sectionId}/${issue.id}/suggest`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuggestions(res.data.candidates ?? []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to get suggestions"));
    } finally {
      setSuggesting(false);
    }
  }

  async function removeRequiredSkill(skill: string) {
    const issue = selectedIssue;
    if (!issue) return;
    setError("");

    const token = localStorage.getItem("token");

    try {
      const res = await axios.put(
        `${API}/issues/${issue.sectionId}/${issue.id}/skills`,
        { skills: (issue.requiredSkills ?? []).filter((s) => s !== skill) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = { ...issue, requiredSkills: res.data.issue.requiredSkills };
      upsertCard(updated);
      emitCardEvent("UPDATE_CARD", cardPayload(updated));
      setSelectedIssue(updated);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update required skills"));
    }
  }

  function showToast(text: string) {
    setToast(text);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 4000);
  }

  function emitAssignment(candidate: Candidate) {
    send({
      type: "ASSIGN_CARD",
      data: {
        boardId: id,
        cardId: selectedIssue?.id,
        userId: candidate.userId,
        username: candidate.username,
        cardTitle: selectedIssue?.title,
        score: candidate.score,
      },
    });
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-black">
        <div className="relative mb-6">
          <div className="h-10 w-10 rounded-full border-2 border-white/10" />
          <div className="animate-spin-slow absolute inset-0 h-10 w-10 rounded-full border-2 border-transparent border-t-[#7b39fc]" />
        </div>
        <span className="font-[family-name:var(--font-manrope)] text-sm text-white/40">
          Loading board...
        </span>
      </div>
    );
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-black font-[family-name:var(--font-inter)] text-white">
        <Header
          active="boards"
          right={
            <Link
              href="/boards"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <ArrowLeft size={14} /> Back to boards
            </Link>
          }
        />

        {/* Board Sub-header */}
        <div className="glass-strong border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between flex-wrap gap-4 px-6 py-3.5 lg:px-8">
            <div className="flex items-center gap-4">
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
                    className="rounded-xl border border-[#7b39fc]/40 bg-black px-3 py-1.5 text-lg font-bold text-white outline-none focus:ring-2 focus:ring-[#7b39fc]/30"
                  />
                  <button
                    type="button"
                    onClick={saveBoardTitle}
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
                    onClick={startRenameBoard}
                    className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white"
                    title="Rename board"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteBoard}
                    className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-red-400/10 hover:text-red-400"
                    title="Delete board"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Live presence indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#1a1a1a] px-3 py-1 text-xs">
                <span
                  className={`h-2 w-2 rounded-full ${
                    connected
                      ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                      : "bg-white/20"
                  }`}
                />
                <span className="text-white/60 font-medium">
                  {connected
                    ? activeUsers.length > 0
                      ? `${activeUsers.length} online`
                      : "Connected"
                    : "Offline"}
                </span>
              </div>

              {/* Stacked online user avatars */}
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

        {/* Board Main Area */}
        <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 p-3.5 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}

          {/* Kanban board columns */}
          <div className="flex items-start gap-5 overflow-x-auto pb-6">
            {sections.map((section) => (
              <div
                key={section.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleMoveCard(section.id)}
                className="flex max-h-[75vh] w-72 shrink-0 flex-col rounded-2xl border border-white/10 bg-[#141414] p-3.5 transition-all duration-200"
              >
                {/* Column header */}
                <div className="mb-3 flex items-center justify-between gap-2">
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
                      className="flex-1 rounded-lg border border-[#7b39fc]/40 bg-black px-2.5 py-1 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-[#7b39fc]/30"
                    />
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="truncate font-[family-name:var(--font-manrope)] text-sm font-semibold text-white">
                        {section.title}
                      </h3>
                      <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] font-medium text-white/50">
                        {section._count.issues}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    {renamingSectionId === section.id ? (
                      <button
                        type="button"
                        onClick={() => saveRenameSection(section)}
                        className="rounded-lg bg-[#7b39fc] px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#8d53ff]"
                      >
                        OK
                      </button>
                    ) : (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setMenuSectionId((prev) =>
                              prev === section.id ? null : section.id
                            )
                          }
                          className="rounded-lg p-1 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                          title="Section options"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {menuSectionId === section.id && (
                          <div className="absolute right-0 top-full z-20 mt-1.5 w-32 rounded-xl border border-white/10 bg-[#1e1e1e] p-1 shadow-xl">
                            <button
                              type="button"
                              onClick={() => startRenameSection(section)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
                            >
                              <Pencil size={12} /> Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(section)}
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

                {/* Cards list */}
                <div className="space-y-2.5 overflow-y-auto pr-0.5">
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
                      className="group cursor-pointer rounded-xl border border-white/[0.06] bg-[#1e1e1e] p-3.5 transition-all duration-200 hover:border-[#7b39fc]/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="break-words text-sm font-medium text-white/90 group-hover:text-white">
                          {issue.title}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(section.id, issue);
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

                      {/* Required skills tags preview */}
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
                        {/* Assignee badges */}
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

                        {/* Comments count */}
                        {issue._count?.comments ? (
                          <div className="flex items-center gap-1 text-[11px] text-white/40">
                            <MessageSquare size={12} />
                            <span>{issue._count.comments}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Card Form */}
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
                    placeholder="Add a card..."
                    className="flex-1 rounded-xl border-none bg-black h-9 px-3 text-xs text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
                  />
                  <button
                    type="submit"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black transition-all duration-200 hover:bg-white/90 active:scale-95 shrink-0"
                    title="Add card"
                  >
                    <Plus size={15} />
                  </button>
                </form>
              </div>
            ))}

            {/* Add Section Column */}
            <div className="w-72 shrink-0">
              <form
                onSubmit={handleCreateSection}
                className="rounded-2xl border border-dashed border-white/10 bg-[#141414]/50 p-4 space-y-3"
              >
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="New section title..."
                  required
                  disabled={creating}
                  className="w-full rounded-xl border-none bg-black h-10 px-3.5 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-[#7b39fc]/30 transition-shadow disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#7b39fc] py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-[#8d53ff] active:scale-[0.98] disabled:opacity-50"
                >
                  <Plus size={14} />
                  {creating ? "Adding..." : "Add Section"}
                </button>
              </form>
            </div>
          </div>
        </main>

        {/* Card Details Modal */}
        <AnimatePresence>
          {selectedIssue && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
              onClick={() => {
                setSelectedIssue(null);
                setShowMembers(false);
                setSuggestOpen(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl border border-white/10 bg-[#161616] shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                  <h2 className="font-[family-name:var(--font-manrope)] text-base font-semibold text-white">
                    Card Details
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIssue(null);
                      setShowMembers(false);
                      setSuggestOpen(false);
                    }}
                    className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="space-y-5 overflow-y-auto p-6">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      Title
                    </label>
                    <input
                      type="text"
                      value={issueTitle}
                      onChange={(e) => setIssueTitle(e.target.value)}
                      className="w-full rounded-xl border-none bg-black h-11 px-4 text-sm font-medium text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      Description
                    </label>
                    <textarea
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      rows={3}
                      placeholder="Add a detailed description..."
                      className="w-full resize-none rounded-xl border-none bg-black p-3.5 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
                    />
                  </div>

                  {/* Save button */}
                  <div>
                    <button
                      type="button"
                      onClick={saveCard}
                      disabled={savingIssue}
                      className="rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition-all duration-200 hover:bg-white/90 active:scale-95 disabled:opacity-50"
                    >
                      {savingIssue ? "Saving..." : "Save changes"}
                    </button>
                  </div>

                  {/* Assignees */}
                  <div className="space-y-2 border-t border-white/[0.06] pt-4">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      Assignees
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedIssue.assignees.map(({ user }) => (
                        <span
                          key={user.id}
                          onClick={() => toggleAssignee({ user } as Member)}
                          className="group flex cursor-pointer items-center gap-1.5 rounded-full bg-[#7b39fc]/15 px-3 py-1 text-xs font-medium text-[#a87aff] transition-colors hover:bg-red-400/10 hover:text-red-400"
                          title={`Click to remove ${user.username}`}
                        >
                          {user.username}
                          <X size={12} className="opacity-60 group-hover:opacity-100" />
                        </span>
                      ))}
                      {selectedIssue.assignees.length === 0 && (
                        <span className="text-xs text-white/30">
                          No assignees yet
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowMembers((v) => !v)}
                        className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
                      >
                        <Users size={12} />
                        {showMembers ? "Close" : "+ Assign"}
                      </button>
                    </div>

                    {/* Member selection dropdown */}
                    {showMembers && (
                      <div className="mt-2 divide-y divide-white/[0.06] rounded-xl border border-white/10 bg-black/60 overflow-hidden">
                        {members.map((member) => (
                          <button
                            key={member.user.id}
                            type="button"
                            onClick={() => toggleAssignee(member)}
                            className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-white/[0.04]"
                          >
                            <span className="font-medium text-white">
                              {member.user.username}
                              {member.user.id === meId && (
                                <span className="ml-1.5 text-white/40">
                                  (you)
                                </span>
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

                  {/* Required Skills & Auto-assignment */}
                  <div className="space-y-2 border-t border-white/[0.06] pt-4">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      Required skills
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(selectedIssue.requiredSkills ?? []).map((skill) => (
                        <span
                          key={skill}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black px-2.5 py-1 text-xs text-white/90"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeRequiredSkill(skill)}
                            className="text-white/30 transition-colors hover:text-red-400"
                            title="Remove skill"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      {(selectedIssue.requiredSkills ?? []).length === 0 && (
                        <span className="text-xs text-white/30">
                          Auto-extracted from title & description
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={suggestAssignees}
                      disabled={suggesting}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7b39fc] to-[#9d6aff] py-2.5 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(123,57,252,0.3)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                    >
                      <Zap size={14} />
                      {suggesting ? "Scoring members..." : "Suggest Assignee (AI Match)"}
                    </button>

                    {/* Suggestions output */}
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
                                <span className="font-semibold text-white truncate">
                                  {c.username}
                                </span>
                                <span className="text-[11px] text-white/40">
                                  score: <strong className="text-white">{c.score}</strong> · precision:{" "}
                                  {Math.round(c.precision * 100)}%
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
                                onClick={() => {
                                  toggleAssignee({
                                    user: {
                                      id: c.userId,
                                      username: c.username,
                                      email: "",
                                    },
                                  });
                                  emitAssignment(c);
                                }}
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

                  {/* Comments Section */}
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
                                onClick={() => deleteComment(comment)}
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

                    <form onSubmit={addComment} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 rounded-xl border-none bg-black h-10 px-3.5 text-xs text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-shadow"
                      />
                      <button
                        type="submit"
                        disabled={savingComment}
                        className="rounded-xl bg-white px-4 text-xs font-semibold text-black transition-colors hover:bg-white/90 disabled:opacity-50"
                      >
                        {savingComment ? "..." : "Send"}
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Board Chat Floating Button */}
        <button
          type="button"
          onClick={() => setChatOpen((v) => !v)}
          className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-2xl transition-all duration-300 ${
            chatOpen
              ? "bg-[#2a2a2a] text-white hover:bg-[#333]"
              : "bg-[#7b39fc] text-white shadow-[0_6px_24px_rgba(123,57,252,0.4)] hover:bg-[#8d53ff] hover:scale-105"
          }`}
        >
          <MessageSquare size={16} />
          {chatOpen ? "Close Chat" : "Live Chat"}
        </button>

        {/* Toast notifications */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#1e1e1e] px-4 py-3 text-xs font-medium text-white shadow-2xl"
            >
              <Sparkles size={14} className="text-[#7b39fc] shrink-0" />
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Board Chat Popup Panel */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass-strong fixed bottom-20 right-6 z-40 flex h-[420px] w-80 flex-col rounded-2xl border border-white/10 bg-[#161616] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={15} className="text-[#7b39fc]" />
                  <span className="font-[family-name:var(--font-manrope)] text-sm font-semibold text-white">
                    Board Chat
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Chat messages */}
              <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
                {messages.map((m, i) => {
                  const isMe = m.userId === meId;
                  return (
                    <div
                      key={i}
                      className={isMe ? "text-right" : "text-left"}
                    >
                      <span className="text-[10px] text-white/40">
                        {isMe ? "You" : m.username || "Someone"}
                        {m.timestamp &&
                          ` · ${new Date(m.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                      </span>
                      <div>
                        <p
                          className={`inline-block mt-1 max-w-[85%] rounded-2xl px-3.5 py-2 text-xs break-words ${
                            isMe
                              ? "bg-[#7b39fc] text-white"
                              : "border border-white/[0.06] bg-[#222] text-white/90"
                          }`}
                        >
                          {m.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center text-white/30 text-xs">
                    <MessageSquare size={24} className="mb-2 text-white/10" />
                    No messages yet. Say hello to your team!
                  </div>
                )}
              </div>

              {/* Send message form */}
              <form
                onSubmit={sendChat}
                className="flex items-center gap-2 border-t border-white/[0.06] p-3"
              >
                <input
                  type="text"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Message team..."
                  className="flex-1 rounded-xl border-none bg-black h-9 px-3 text-xs text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-[#7b39fc]/30"
                />
                <button
                  type="submit"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7b39fc] text-white transition-colors hover:bg-[#8d53ff] shrink-0"
                  title="Send"
                >
                  <Send size={13} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RequireAuth>
  );
}