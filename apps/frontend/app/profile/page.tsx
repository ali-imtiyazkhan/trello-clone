"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RequireAuth from "../components/RequireAuth";
import Header from "../components/Header";
import { getSkillDictionary } from "@repo/shared";

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

const SOURCE_BADGE: Record<userSkill["source"], string> = {
  RESUME: "bg-blue-400/10 text-blue-400",
  GITHUB: "bg-purple-400/10 text-purple-400",
  MANUAL: "bg-green-400/10 text-green-400",
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
      <div className="min-h-screen bg-black text-white font-[family-name:var(--font-inter)]">
        <Header active="profile" />
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {error && (
            <div className="p-3 bg-red-400/10 border border-red-400/20 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}
          {notice && (
            <div className="p-3 bg-green-400/10 border border-green-400/20 text-green-400 rounded-xl text-sm">
              {notice}
            </div>
          )}

          <section className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-white">Link GitHub</h2>
            <form onSubmit={handleGithubSync} className="flex gap-2">
              <input
                type="text"
                value={githubInput}
                onChange={(e) => setGithubInput(e.target.value)}
                placeholder="GitHub username"
                className="flex-1 max-w-xs bg-black border border-white/10 rounded-xl h-11 px-4 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-shadow duration-200"
              />
              <button
                type="submit"
                disabled={syncingGithub}
                className="bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {syncingGithub ? "Syncing..." : "Sync"}
              </button>
            </form>
            <p className="text-xs text-white/40">
              {githubUsername
                ? `Linked to @${githubUsername}${
                    githubSyncedAt
                      ? ` · synced ${new Date(githubSyncedAt).toLocaleString()}`
                      : ""
                  }`
                : "Connect your GitHub username to auto-extract skills from your repos."}
            </p>
          </section>

          <section className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-white">Upload resume</h2>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
              className="block w-full text-sm text-white/40 file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border-0 file:bg-white file:text-black file:text-sm file:font-semibold file:hover:bg-white/90 file:transition-colors disabled:opacity-50"
            />
            {uploading && (
              <p className="text-xs text-white/40">Parsing resume...</p>
            )}
            {parsed && (
              <div>
                <p className="text-xs font-medium text-white/40 mb-1">
                  Found in resume:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.map((h) => (
                    <span
                      key={h.name}
                      className="text-xs bg-black border border-white/10 rounded-full px-2.5 py-1 text-white"
                    >
                      {h.name} ×{h.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-white">
              My skills ({skills.length})
            </h2>
            {skills.length === 0 && (
              <p className="text-sm text-white/40">
                No skills yet. Upload a resume, link GitHub, or add skills
                manually below.
              </p>
            )}
            <ul className="space-y-3">
              {skills.map((skill) => (
                <li key={skill.id} className="flex items-center gap-3">
                  <span className="w-40 text-sm text-white truncate">
                    {skill.name}
                  </span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full"
                      style={{ width: `${Math.round(skill.strength * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/40 w-10 text-right">
                    {Math.round(skill.strength * 100)}%
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      SOURCE_BADGE[skill.source]
                    }`}
                  >
                    {skill.source}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSkill(skill)}
                    className="text-xs text-white/40 hover:text-red-400 transition-colors"
                    title="Delete skill"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-white">Add skills manually</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills..."
              className="w-full bg-black border border-white/10 rounded-xl h-11 px-4 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-shadow duration-200"
            />
            <form onSubmit={handleSaveManual} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                {filteredDictionary.slice(0, 40).map((name) => {
                  const value = manual[name] ?? 0;
                  return (
                    <label
                      key={name}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                        value > 0
                          ? "border-white bg-white/10 text-white"
                          : "border-white/10 bg-black text-white/40 hover:border-white/30"
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
                        className="text-xs bg-[#1a1a1a] border border-white/10 rounded px-1 py-0.5 text-white"
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
                className="bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {savingManual ? "Saving..." : "Save manual skills"}
              </button>
            </form>
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}