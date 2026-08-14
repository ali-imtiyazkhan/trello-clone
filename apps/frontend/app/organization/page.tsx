"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Building2, Plus, Trash2, Users, LayoutGrid, ArrowRight } from "lucide-react";
import Header from "../components/Header";
import RequireAuth from "../components/RequireAuth";

const API = "http://localhost:3001/api";

type Org = {
  id: string;
  name: string;
  description: string;
  role: string;
  _count: { boards: number; memberships: number };
};

type Member = {
  id: string;
  role: string;
  user: {
    id: string;
    username: string;
    email: string;
    skills?: {
      id: string;
      name: string;
      strength: number;
      source: string;
    }[];
  };
};

type OrgDetail = {
  id: string;
  name: string;
  description: string;
  role: string;
  boards: { id: string; title: string }[];
  memberships: Member[];
};

type Me = { id: string; username: string; email: string };

function getErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}

const ROLE_BADGE: Record<string, string> = {
  OWNER: "bg-[#7b39fc]/15 text-[#a87aff]",
  ADMIN: "bg-blue-400/10 text-blue-400",
  MEMBER: "bg-white/[0.06] text-white/50",
};

export default function OrganizationPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadOrgs() {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in first");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API}/orgs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrgs(res.data.organizations ?? []);
      setSelectedId((prev) => prev || res.data.organizations?.[0]?.id || "");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load organizations"));
    } finally {
      setLoading(false);
    }
  }

  const loadDetail = useCallback(async (orgId: string) => {
    const token = localStorage.getItem("token");
    if (!token || !orgId) return;

    try {
      const res = await axios.get(`${API}/orgs/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetail(res.data.organization);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load organization"));
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId, loadDetail]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMe(res.data.user))
      .catch(() => setMe(null));
  }, []);

  async function handleCreateOrg(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setCreating(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in first");
      setCreating(false);
      return;
    }

    try {
      const res = await axios.post(
        `${API}/orgs`,
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const created = res.data.org;
      setOrgs((prev) => [
        ...prev,
        {
          ...created,
          role: "OWNER",
          _count: { boards: 0, memberships: 1 },
        },
      ]);
      setSelectedId(created.id);
      setName("");
      setDescription("");
      setShowForm(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create organization"));
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteOrg(org: Org) {
    if (!window.confirm(`Delete "${org.name}" and all its boards?`)) return;
    setError("");

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API}/orgs/${org.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrgs((prev) => prev.filter((o) => o.id !== org.id));
      if (selectedId === org.id) {
        setSelectedId("");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete organization"));
    }
  }

  async function handleRemoveMember(member: Member) {
    if (!detail) return;
    if (!window.confirm(`Remove ${member.user.username} from this organization?`))
      return;
    setError("");

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API}/orgs/${detail.id}/members/${member.user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              memberships: prev.memberships.filter(
                (m) => m.user.id !== member.user.id
              ),
            }
          : prev
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to remove member"));
    }
  }

  async function handleChangeRole(
    member: Member,
    role: "OWNER" | "ADMIN" | "MEMBER"
  ) {
    if (!detail || role === member.role) return;
    setError("");

    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${API}/orgs/${detail.id}/members/${member.user.id}`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              memberships: prev.memberships.map((m) =>
                m.user.id === member.user.id ? { ...m, role } : m
              ),
            }
          : prev
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to change role"));
    }
  }

  const canManage = detail?.role === "OWNER" || detail?.role === "ADMIN";

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black">
        <div className="relative mb-6">
          <div className="h-10 w-10 rounded-full border-2 border-white/10" />
          <div className="animate-spin-slow absolute inset-0 h-10 w-10 rounded-full border-2 border-transparent border-t-[#7b39fc]" />
        </div>
        <span className="font-[family-name:var(--font-manrope)] text-sm text-white/40">
          Loading organizations...
        </span>
      </div>
    );
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-black font-[family-name:var(--font-inter)]">
        <Header active="orgs" />

        <main className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 p-3.5 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}

          {orgs.length === 0 && !showForm ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center py-24 text-center"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#1a1a1a]">
                <Building2 className="h-7 w-7 text-white/30" />
              </div>
              <h2 className="font-[family-name:var(--font-manrope)] text-xl font-semibold text-white">
                No organizations yet
              </h2>
              <p className="mt-2 max-w-sm text-sm text-white/40">
                Create your first organization to start collaborating with your
                team.
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-8 rounded-xl bg-[#7b39fc] px-6 py-3 font-[family-name:var(--font-cabin)] text-sm font-semibold text-white shadow-[0_4px_20px_rgba(123,57,252,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#8d53ff] active:translate-y-0"
              >
                Create organization
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_1fr]">
              {/* Sidebar */}
              <motion.aside
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-[family-name:var(--font-manrope)] text-sm font-semibold text-white">
                    Your organizations
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowForm((v) => !v)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#7b39fc] transition-colors hover:bg-[#7b39fc]/10"
                  >
                    {showForm ? (
                      "Cancel"
                    ) : (
                      <>
                        <Plus size={13} /> New
                      </>
                    )}
                  </button>
                </div>

                {showForm && (
                  <form onSubmit={handleCreateOrg} className="mb-4 space-y-2.5">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Organization name"
                      required
                      disabled={creating}
                      className="w-full rounded-xl border-none bg-black h-10 px-3.5 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-shadow duration-200 disabled:opacity-50"
                    />
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description (optional)"
                      disabled={creating}
                      className="w-full rounded-xl border-none bg-black h-10 px-3.5 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-shadow duration-200 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={creating}
                      className="w-full rounded-xl bg-[#7b39fc] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8d53ff] disabled:opacity-50"
                    >
                      {creating ? "Creating..." : "Create"}
                    </button>
                  </form>
                )}

                <ul className="space-y-1">
                  {orgs.map((org) => (
                    <li key={org.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(org.id)}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-left text-sm transition-all duration-200 ${
                          selectedId === org.id
                            ? "bg-[#7b39fc]/10 text-white border border-[#7b39fc]/20"
                            : "text-white/50 hover:bg-white/[0.04] hover:text-white/70 border border-transparent"
                        }`}
                      >
                        <span className="font-medium block">{org.name}</span>
                        <span className="block mt-0.5 text-xs opacity-60">
                          {org._count.boards} boards · {org._count.memberships}{" "}
                          members
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.aside>

              {/* Detail panel */}
              <motion.section
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6"
              >
                {!detail ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <Building2 className="h-8 w-8 text-white/20 mb-3" />
                    <p className="text-white/40 text-sm">
                      Select an organization to see its details.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="mb-6 flex items-start justify-between">
                      <div>
                        <h2 className="font-[family-name:var(--font-manrope)] text-xl font-semibold text-white">
                          {detail.name}
                        </h2>
                        {detail.description && (
                          <p className="mt-1.5 text-sm text-white/40">
                            {detail.description}
                          </p>
                        )}
                        <span
                          className={`mt-2.5 inline-block rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${
                            ROLE_BADGE[detail.role] ?? ROLE_BADGE.MEMBER
                          }`}
                        >
                          {detail.role.toLowerCase()}
                        </span>
                      </div>
                      {detail.role === "OWNER" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteOrg({
                              id: detail.id,
                              name: detail.name,
                              description: detail.description,
                              role: detail.role,
                              _count: {
                                boards: detail.boards.length,
                                memberships: detail.memberships.length,
                              },
                            })
                          }
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-400/10"
                        >
                          <Trash2 size={13} /> Delete org
                        </button>
                      )}
                    </div>

                    {/* Boards */}
                    <div className="mb-6">
                      <div className="mb-3 flex items-center gap-2">
                        <LayoutGrid size={15} className="text-white/40" />
                        <h3 className="font-[family-name:var(--font-manrope)] text-sm font-semibold text-white">
                          Boards
                        </h3>
                      </div>
                      {detail.boards.length === 0 ? (
                        <p className="rounded-xl bg-black/50 border border-white/[0.06] px-4 py-3 text-sm text-white/30">
                          No boards yet.{" "}
                          <Link
                            href="/boards"
                            className="text-[#7b39fc] hover:underline"
                          >
                            Create one
                          </Link>
                          .
                        </p>
                      ) : (
                        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {detail.boards.map((board) => (
                            <li key={board.id}>
                              <Link
                                href={`/boards/${board.id}`}
                                className="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/40 px-4 py-3 transition-all duration-200 hover:border-[#7b39fc]/30 hover:bg-black/60"
                              >
                                <span className="text-sm font-medium text-white">
                                  {board.title}
                                </span>
                                <ArrowRight
                                  size={14}
                                  className="text-white/20 transition-all group-hover:text-[#7b39fc] group-hover:translate-x-0.5"
                                />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Members */}
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <Users size={15} className="text-white/40" />
                        <h3 className="font-[family-name:var(--font-manrope)] text-sm font-semibold text-white">
                          Members ({detail.memberships.length})
                        </h3>
                      </div>
                      <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-black/40 overflow-hidden">
                        {detail.memberships.map((member) => (
                          <li
                            key={member.id}
                            className="flex items-center justify-between gap-3 px-4 py-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Avatar */}
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7b39fc]/15 text-xs font-semibold text-[#a87aff]">
                                {member.user.username.slice(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">
                                  {member.user.username}
                                  {member.user.id === me?.id && (
                                    <span className="ml-1.5 text-xs font-normal text-white/30">
                                      (you)
                                    </span>
                                  )}
                                </p>
                                <p className="truncate text-xs text-white/30">
                                  {member.user.email}
                                </p>
                                {(member.user.skills?.length ?? 0) > 0 && (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {member.user.skills!.slice(0, 3).map((skill) => (
                                      <span
                                        key={skill.id}
                                        className="rounded-md bg-[#7b39fc]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#a87aff]"
                                      >
                                        {skill.name}
                                      </span>
                                    ))}
                                    {(member.user.skills?.length ?? 0) > 3 && (
                                      <span className="text-[10px] text-white/30">
                                        +{member.user.skills!.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {detail.role === "OWNER" &&
                              member.role !== "OWNER" ? (
                                <select
                                  value={member.role}
                                  onChange={(e) =>
                                    handleChangeRole(
                                      member,
                                      e.target.value as "OWNER" | "ADMIN" | "MEMBER"
                                    )
                                  }
                                  className="rounded-lg border border-white/10 bg-black px-2 py-1 text-xs text-white outline-none focus:ring-2 focus:ring-[#7b39fc]/30"
                                >
                                  <option value="ADMIN">Admin</option>
                                  <option value="MEMBER">Member</option>
                                </select>
                              ) : (
                                <span
                                  className={`rounded-lg px-2 py-1 text-xs font-medium capitalize ${
                                    ROLE_BADGE[member.role] ?? ROLE_BADGE.MEMBER
                                  }`}
                                >
                                  {member.role.toLowerCase()}
                                </span>
                              )}
                              {canManage &&
                                member.user.id !== me?.id &&
                                member.role !== "OWNER" && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(member)}
                                    className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-red-400/10 hover:text-red-400"
                                    title="Remove member"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </motion.section>
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}