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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Board</h1>

      {error && <div>{error}</div>}

      <div>
        <h2>Sections</h2>
        {sections.map((section) => (
          <div key={section.id}>
            <h3>{section.title}</h3>
            <span>{section._count.issues} issues</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreateSection}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter section title"
          required
          disabled={creating}
        />
        <button type="submit" disabled={creating}>
          {creating ? "Creating..." : "Add section"}
        </button>
      </form>
    </div>
  );
}