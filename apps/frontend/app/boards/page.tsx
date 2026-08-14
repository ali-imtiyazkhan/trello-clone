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
  role: string;
};

type Board = {
  id: string;
  title: string;
  _count: { issues: number; sections: number };
};

function getErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}

export default function BoardPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeOrgId, setActiveOrgId] = useState("");
  const [boards, setBoards] = useState<Board[]>([]);
  const [title, setTitle] = useState("");
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
      const res = await axios.get<{ organizations: Org[] }>(`${API}/orgs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const organizations = res.data.organizations ?? [];
      setOrgs(organizations);
      setActiveOrgId(
        (prev) =>
          prev ||
          organizations.find((o) => o.id === prev)?.id ||
          organizations[0]?.id ||
          ""
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load organizations"));
    } finally {
      setLoading(false);
    }
  }

  const loadBoards = useCallback(async (orgId: string) => {
    const token = localStorage.getItem("token");
    if (!token || !orgId) {
      setBoards([]);
      return;
    }

    try {
      const res = await axios.get(`${API}/boards`, {
        params: { orgId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setBoards(res.data.boards ?? []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load boards"));
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, []);

  useEffect(() => {
    loadBoards(activeOrgId);
  }, [activeOrgId, loadBoards]);

  async function handleCreateBoard(e: React.FormEvent<HTMLFormElement>) {
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
        `${API}/boards`,
        { title, organizationId: activeOrgId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const created = res.data.result;
      setBoards((prev) => [
        ...prev,
        { ...created, _count: { issues: 0, sections: 0 } },
      ]);
      setTitle("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create board"));
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-text-secondary">
        Loading...
      </div>
    );
  }

  const activeOrg = orgs.find((org) => org.id === activeOrgId);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <Header active="boards" />

        <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-400/10 border border-red-400/20 text-red-400 rounded-md text-sm">
            {error}
          </div>
        )}

        {orgs.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">
            <p className="text-lg">You are not part of any organization</p>
            <p className="mt-1 text-sm">Create an organization to get started</p>
            <Link
              href="/organization"
              className="inline-block mt-6 bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-white/90 transition-colors"
            >
              Create organization
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {orgs.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => setActiveOrgId(org.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    activeOrgId === org.id
                      ? "bg-white text-black border-primary"
                      : "bg-surface text-text-secondary border-border hover:text-text-primary hover:border-primary/50"
                  }`}
                >
                  {org.name}
                  <span className="ml-1 text-xs opacity-70 capitalize">
                    · {org.role.toLowerCase()}
                  </span>
                </button>
              ))}
            </div>

            {activeOrg && (
              <form onSubmit={handleCreateBoard} className="mb-8 flex gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`New board in "${activeOrg.name}"`}
                  required
                  disabled={creating}
                  className="flex-1 max-w-sm px-3 py-2 border border-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? "Creating..." : "Create board"}
                </button>
              </form>
            )}

            {boards.length === 0 ? (
              <div className="text-center py-16 text-text-secondary">
                <p className="text-lg">No boards yet</p>
                <p className="mt-1 text-sm">Create your first board above</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {boards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/boards/${board.id}`}
                    className="group bg-surface border border-border rounded-lg p-5 hover:border-primary/50 hover:shadow-sm transition-all"
                  >
                    <h2 className="font-medium text-text-primary group-hover:text-primary transition-colors">
                      {board.title}
                    </h2>
                    <p className="mt-2 text-sm text-text-secondary">
                      {board._count.sections} section
                      {board._count.sections === 1 ? "" : "s"} ·{" "}
                      {board._count.issues} issue
                      {board._count.issues === 1 ? "" : "s"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
    </RequireAuth>
  );
}