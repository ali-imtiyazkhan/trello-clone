"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, type Variants } from "motion/react";
import { Upload, Sparkles, Search, Trash2 } from "lucide-react";
import RequireAuth from "../components/RequireAuth";
import Header from "../components/Header";
import { getSkillDictionary } from "@repo/shared";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.11-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.35.78 1.05.78 2.12v3.14c0 .3.21.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

const API = "http://localhost:3001/api";

type userSkill = {
  id: string;
  name: string;
  source: "GITHUB" | "RESUME" | "MANUAL";
  strength: number;
  occurrenceCount: number;
};

type skillHit = { name: string; count: number };

function getErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}

const SOURCE_BADGE: Record<userSkill["source"], { bg: string; text: string }> = {
  RESUME: { bg: "bg-blue-400/10", text: "text-blue-400" },
  GITHUB: { bg: "bg-purple-400/10", text: "text-purple-400" },
  MANUAL: { bg: "bg-emerald-400/10", text: "text-emerald-400" },
};

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const sectionItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function ProfilePage() {
  const [skills, setSkills] = useState<userSkill[]>([]);
  const [githubUsername, setGithubUsername] = useState("");
  const [githubSyncedAt, setGithubSyncedAt] = useState<string | null>(null);
  const [githubInput, setGithubInput] = useState("");
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsed, setParsed] = useState<skillHit[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const dictionary = useMemo(() => getSkillDictionary().map((s) => s.name), []);
  const [search, setSearch] = useState("");
  const [manual, setManual] = useState<Record<string, number>>({});
  const [savingManual, setSavingManual] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  function auth() {
    return {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    };
  }

  const loadProfile = useCallback(async () => {
    setError("");
    try {
      const res = await axios.get(`${API}/profile`, auth());
      const user = res.data.user;
      setSkills(user.skills ?? []);
      setGithubUsername(user.githubUsername ?? "");
      setGithubSyncedAt(user.githubSyncedAt ?? null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load profile"));
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    setParsed(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await axios.post(`${API}/profile/resume`, form, auth());
      setParsed(res.data.skills ?? []);
      setNotice("Resume parsed! Skills were added to your profile.");
      await loadProfile();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload resume"));
    } finally {
      setUploading(false);
    }
  }

  async function handleGithubSync(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const username = githubInput.trim();
    if (!username || syncingGithub) return;
    setSyncingGithub(true);
    setError("");
    try {
      await axios.post(`${API}/profile/github`, { username }, auth());
      setNotice(`GitHub profile for @${username} synced!`);
      setGithubInput("");
      await loadProfile();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to sync GitHub"));
    } finally {
      setSyncingGithub(false);
    }
  }

  async function handleDeleteSkill(skill: userSkill) {
    if (!window.confirm(`Delete skill "${skill.name}"?`)) return;
    setError("");
    try {
      await axios.delete(`${API}/profile/skills/${skill.id}`, auth());
      setSkills((prev) => prev.filter((s) => s.id !== skill.id));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete skill"));
    }
  }

  async function handleSaveManual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const entries = Object.entries(manual).filter(([, v]) => v > 0);
    if (entries.length === 0) return;
    setSavingManual(true);
    setError("");
    try {
      await axios.post(
        `${API}/profile/skills`,
        { skills: entries.map(([name, strength]) => ({ name, strength })) },
        auth()
      );
      setNotice("Manual skills saved!");
      setManual({});
      await loadProfile();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save manual skills"));
    } finally {
      setSavingManual(false);
    }
  }

  const filteredDictionary = dictionary.filter((name) =>
    name.includes(search.trim().toLowerCase())
  );

  return (
    <RequireAuth>
      <div className="min-h-screen bg-black font-[family-name:var(--font-inter)] text-white">
        <Header active="profile" />

        <main className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 p-3.5 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3.5 text-sm text-emerald-400"
            >
              {notice}
            </motion.div>
          )}

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Link GitHub */}
            <motion.section
              variants={sectionItem}
              className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-400/10">
                  <GithubIcon className="h-4 w-4 text-purple-400" />
                </div>
                <h2 className="font-[family-name:var(--font-manrope)] text-[15px] font-semibold text-white">
                  Link GitHub
                </h2>
              </div>
              <form onSubmit={handleGithubSync} className="flex gap-3">
                <input
                  type="text"
                  value={githubInput}
                  onChange={(e) => setGithubInput(e.target.value)}
                  placeholder="GitHub username"
                  className="flex-1 max-w-xs rounded-xl border-none bg-black h-11 px-4 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-shadow duration-200"
                />
                <button
                  type="submit"
                  disabled={syncingGithub}
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:bg-white/90 active:scale-[0.97] disabled:opacity-50"
                >
                  {syncingGithub ? "Syncing..." : "Sync"}
                </button>
              </form>
              <p className="text-xs text-white/30">
                {githubUsername
                  ? `Linked to @${githubUsername}${
                      githubSyncedAt
                        ? ` · synced ${new Date(githubSyncedAt).toLocaleString()}`
                        : ""
                    }`
                  : "Connect your GitHub username to auto-extract skills from your repos."}
              </p>
            </motion.section>

            {/* Upload Resume */}
            <motion.section
              variants={sectionItem}
              className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-400/10">
                  <Upload size={16} className="text-blue-400" />
                </div>
                <h2 className="font-[family-name:var(--font-manrope)] text-[15px] font-semibold text-white">
                  Upload resume
                </h2>
              </div>
              <div
                onClick={() => fileRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-white/10 bg-black/40 px-6 py-8 text-center transition-colors hover:border-white/20"
              >
                <Upload size={24} className="mx-auto mb-2 text-white/20" />
                <p className="text-sm text-white/40">
                  Click to upload <span className="text-white/60">PDF</span> or{" "}
                  <span className="text-white/60">TXT</span>
                </p>
                <p className="mt-1 text-xs text-white/20">
                  Skills will be automatically extracted
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
                className="hidden"
              />
              {uploading && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin-slow h-4 w-4 rounded-full border-2 border-transparent border-t-[#7b39fc]" />
                  <p className="text-xs text-white/40">Parsing resume...</p>
                </div>
              )}
              {parsed && (
                <div>
                  <p className="mb-2 text-xs font-medium text-white/40">
                    Found in resume:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {parsed.map((h) => (
                      <span
                        key={h.name}
                        className="rounded-lg border border-white/10 bg-black px-2.5 py-1 text-xs text-white"
                      >
                        {h.name}{" "}
                        <span className="text-white/40">×{h.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.section>

            {/* My Skills */}
            <motion.section
              variants={sectionItem}
              className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7b39fc]/10">
                  <Sparkles size={16} className="text-[#7b39fc]" />
                </div>
                <h2 className="font-[family-name:var(--font-manrope)] text-[15px] font-semibold text-white">
                  My skills{" "}
                  <span className="text-white/30">({skills.length})</span>
                </h2>
              </div>
              {skills.length === 0 && (
                <p className="text-sm text-white/30">
                  No skills yet. Upload a resume, link GitHub, or add skills
                  manually below.
                </p>
              )}
              <ul className="space-y-2.5">
                {skills.map((skill) => {
                  const badge = SOURCE_BADGE[skill.source];
                  return (
                    <li
                      key={skill.id}
                      className="group flex items-center gap-3 rounded-xl bg-black/40 border border-white/[0.06] px-4 py-2.5"
                    >
                      <span className="w-32 truncate text-sm font-medium text-white sm:w-40">
                        {skill.name}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#7b39fc] to-white"
                          style={{
                            width: `${Math.round(skill.strength * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs text-white/40">
                        {Math.round(skill.strength * 100)}%
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text}`}
                      >
                        {skill.source}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSkill(skill)}
                        className="rounded-lg p-1 text-white/20 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-400/10 hover:text-red-400"
                        title="Delete skill"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.section>

            {/* Add Skills Manually */}
            <motion.section
              variants={sectionItem}
              className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10">
                  <Search size={16} className="text-emerald-400" />
                </div>
                <h2 className="font-[family-name:var(--font-manrope)] text-[15px] font-semibold text-white">
                  Add skills manually
                </h2>
              </div>
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search skills..."
                  className="w-full rounded-xl border-none bg-black h-11 pl-10 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-shadow duration-200"
                />
              </div>
              <form onSubmit={handleSaveManual} className="space-y-4">
                <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                  {filteredDictionary.slice(0, 40).map((name) => {
                    const value = manual[name] ?? 0;
                    return (
                      <label
                        key={name}
                        className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-200 ${
                          value > 0
                            ? "border-[#7b39fc]/30 bg-[#7b39fc]/[0.08] text-white"
                            : "border-white/[0.06] bg-black/40 text-white/40 hover:border-white/15 hover:text-white/60"
                        }`}
                      >
                        <span className="truncate">{name}</span>
                        <select
                          value={value}
                          onChange={(e) =>
                            setManual((prev) => ({
                              ...prev,
                              [name]: Number(e.target.value),
                            }))
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg border border-white/10 bg-black px-1.5 py-0.5 text-xs text-white outline-none"
                        >
                          <option value={0}>–</option>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
                </div>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:bg-white/90 active:scale-[0.97] disabled:opacity-50"
                >
                  {savingManual ? "Saving..." : "Save manual skills"}
                </button>
              </form>
            </motion.section>
          </motion.div>
        </main>
      </div>
    </RequireAuth>
  );
}