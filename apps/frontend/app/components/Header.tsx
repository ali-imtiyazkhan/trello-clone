"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API = "http://localhost:3001/api";

type NavLinkProps = {
  href: string;
  active?: boolean;
  children: React.ReactNode;
};

function NavLink({ href, active, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        active
          ? "text-text-primary font-medium"
          : "text-text-secondary hover:text-text-primary"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Header({
  active,
  right,
}: {
  active?: "boards" | "orgs";
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUsername(res.data.user.username))
      .catch(() => setUsername(""));
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    router.replace("/signin");
  }

  return (
    <header className="bg-surface border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-white text-sm font-bold">
              T
            </span>
            <span className="text-lg font-semibold tracking-tight text-text-primary hidden sm:block">
              Trello Clone
            </span>
          </Link>

          <nav className="flex items-center gap-5">
            <NavLink href="/boards" active={active === "boards"}>
              Boards
            </NavLink>
            <NavLink href="/organization" active={active === "orgs"}>
              Organizations
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {right}
          {username && (
            <span className="text-sm text-text-secondary truncate max-w-[120px]">
              {username}
            </span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-text-secondary hover:text-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}