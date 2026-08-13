"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [sections, setSections] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadSections() {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please sign in first");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:3001/api/sections/board/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSections(res.data.sections);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load sections");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSections();
  }, [id]);

  async function handleCreateSection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setCreating(true);

    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(
        "http://localhost:3001/api/sections",
        { title, boardId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSections((prev) => [...prev, res.data.section]);
      setTitle("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create section");
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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-text-primary">Board</h1>
          <a href="/boards" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            &larr; Back to boards
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {sections.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">
            <p className="text-lg">No sections yet</p>
            <p className="mt-1 text-sm">Create your first section below</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {sections.map((section) => (
              <div
                key={section.id}
                className="w-64 shrink-0 bg-surface border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-text-primary">{section.title}</h3>
                  <span className="text-xs text-text-secondary">
                    {section._count.issues} issues
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleCreateSection} className="mt-8 flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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