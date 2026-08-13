"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
  user: { id: string; username: string; email: string };
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
      <div className="min-h-screen bg-background flex items-center justify-center text-text-secondary">
        Loading...
      </div>
    );
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <Header active="orgs" />

        <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {orgs.length === 0 && !showForm ? (
          <div className="text-center py-20 text-text-secondary">
            <p className="text-lg">No organizations yet</p>
            <p className="mt-1 text-sm">
              Create your first organization to start working
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-6 bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-primary-hover transition-colors"
            >
              Create organization
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
            <aside className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium text-text-primary">Your orgs</h2>
                <button
                  type="button"
                  onClick={() => setShowForm((v) => !v)}
                  className="text-sm text-primary hover:underline"
                >
                  {showForm ? "Cancel" : "New"}
                </button>
              </div>

              {showForm && (
                <form onSubmit={handleCreateOrg} className="space-y-2 mb-4">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Org name"
                    required
                    disabled={creating}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description (optional)"
                    disabled={creating}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full bg-primary text-white py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
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
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedId === org.id
                          ? "bg-primary/10 text-text-primary"
                          : "text-text-secondary hover:bg-background hover:text-text-primary"
                      }`}
                    >
                      <span className="font-medium">{org.name}</span>
                      <span className="block text-xs">
                        {org._count.boards} boards · {org._count.memberships}{" "}
                        members · {org.role.toLowerCase()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <section className="bg-surface border border-border rounded-lg p-6">
              {!detail ? (
                <p className="text-text-secondary">
                  Select an organization to see its details.
                </p>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-text-primary">
                        {detail.name}
                      </h2>
                      {detail.description && (
                        <p className="mt-1 text-sm text-text-secondary">
                          {detail.description}
                        </p>
                      )}
                      <span className="inline-block mt-2 text-xs bg-primary/10 text-text-primary rounded-full px-2 py-0.5 capitalize">
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
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete org
                      </button>
                    )}
                  </div>

                  <h3 className="font-medium text-text-primary mb-2">
                    Boards
                  </h3>
                  {detail.boards.length === 0 ? (
                    <p className="text-sm text-text-secondary mb-6">
                      No boards yet.{" "}
                      <Link href="/boards" className="text-primary hover:underline">
                        Create one
                      </Link>
                      .
                    </p>
                  ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {detail.boards.map((board) => (
                        <li key={board.id}>
                          <Link
                            href={`/boards/${board.id}`}
                            className="block p-3 border border-border rounded-md bg-background hover:border-primary/50 transition-colors"
                          >
                            <span className="text-sm font-medium text-text-primary">
                              {board.title}
                            </span>
                            <span className="block text-xs text-text-secondary mt-0.5">
                              Open board &rarr;
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  <h3 className="font-medium text-text-primary mb-2">
                    Members
                  </h3>
                  <ul className="divide-y divide-border border border-border rounded-md bg-background">
                    {detail.memberships.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {member.user.username}
                            {member.user.id === me?.id && (
                              <span className="ml-2 text-xs text-text-secondary font-normal">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-text-secondary truncate">
                            {member.user.email}
                          </p>
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
                              className="px-2 py-1 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="MEMBER">Member</option>
                            </select>
                          ) : (
                            <span className="text-xs text-text-secondary capitalize">
                              {member.role.toLowerCase()}
                            </span>
                          )}
                          {canManage &&
                            member.user.id !== me?.id &&
                            member.role !== "OWNER" && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(member)}
                                className="text-xs text-text-secondary hover:text-red-600 transition-colors"
                                title="Remove member"
                              >
                                Remove
                              </button>
                            )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
    </RequireAuth>
  );
}