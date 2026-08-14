"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion, type Variants } from "motion/react";
import { LayoutGrid, Plus, Building2, ArrowRight } from "lucide-react";
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

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function BoardPage() {
  const router = useRouter();
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
        { ...created, _count: { issues: 0, sections: 3 } },
      ]);
      setTitle("");
      router.push(`/boards/${created.id}`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create board"));
    } finally {
      setCreating(false);
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
          Loading boards...
        </span>
      </div>
    );
  }

  const activeOrg = orgs.find((org) => org.id === activeOrgId);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-black font-[family-name:var(--font-inter)]">
        <Header active="boards" />

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

          {orgs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center py-24 text-center"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a1a1a] border border-white/10">
                <Building2 className="h-7 w-7 text-white/30" />
              </div>
              <h2 className="font-[family-name:var(--font-manrope)] text-xl font-semibold text-white">
                No organizations yet
              </h2>
              <p className="mt-2 max-w-sm text-sm text-white/40">
                Create an organization first, then you can add boards and
                collaborate with your team.
              </p>
              <Link
                href="/organization"
                className="mt-8 rounded-xl bg-[#7b39fc] px-6 py-3 font-[family-name:var(--font-cabin)] text-sm font-semibold text-white shadow-[0_4px_20px_rgba(123,57,252,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#8d53ff] active:translate-y-0"
              >
                Create organization
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Org tabs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8 flex flex-wrap items-center gap-2"
              >
                {orgs.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => setActiveOrgId(org.id)}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      activeOrgId === org.id
                        ? "bg-[#7b39fc] text-white shadow-[0_2px_12px_rgba(123,57,252,0.3)]"
                        : "bg-[#1a1a1a] text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    {org.name}
                    <span className="ml-1.5 text-xs opacity-60 capitalize">
                      · {org.role.toLowerCase()}
                    </span>
                  </button>
                ))}
              </motion.div>

              {/* Create board form */}
              {activeOrg && (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  onSubmit={handleCreateBoard}
                  className="mb-8 flex gap-3"
                >
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`New board in "${activeOrg.name}"`}
                    required
                    disabled={creating}
                    className="flex-1 max-w-md rounded-xl border-none bg-[#1a1a1a] h-11 px-4 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-shadow duration-200 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:bg-white/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                    {creating ? "Creating..." : "Create board"}
                  </button>
                </motion.form>
              )}

              {/* Board grid */}
              {boards.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center py-20 text-center"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a1a1a] border border-white/10">
                    <LayoutGrid className="h-6 w-6 text-white/30" />
                  </div>
                  <p className="text-lg font-medium text-white/60">
                    No boards yet
                  </p>
                  <p className="mt-1 text-sm text-white/30">
                    Create your first board above to get started
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {boards.map((board) => (
                    <motion.div key={board.id} variants={item}>
                      <Link
                        href={`/boards/${board.id}`}
                        className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 transition-all duration-300 hover:border-[#7b39fc]/40 hover:shadow-[0_4px_24px_rgba(123,57,252,0.12)]"
                      >
                        {/* Top accent gradient */}
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#7b39fc]/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                        <h2 className="font-[family-name:var(--font-manrope)] text-[15px] font-semibold text-white transition-colors group-hover:text-white">
                          {board.title}
                        </h2>
                        <p className="mt-2.5 text-[13px] text-white/40">
                          {board._count.sections} section
                          {board._count.sections === 1 ? "" : "s"} ·{" "}
                          {board._count.issues} issue
                          {board._count.issues === 1 ? "" : "s"}
                        </p>

                        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-white/30 transition-colors group-hover:text-[#7b39fc]">
                          Open board
                          <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}