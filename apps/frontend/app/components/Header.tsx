"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { motion } from "motion/react";

const API = "http://localhost:3001/api";

const NAV_ITEMS = [
  { label: "Boards", href: "/boards", key: "boards" as const },
  { label: "Organizations", href: "/organization", key: "orgs" as const },
  { label: "Profile", href: "/profile", key: "profile" as const },
];

export default function Header({
  active,
  right,
}: {
  active?: "boards" | "orgs" | "profile";
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

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

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.replace("/signin");
  }

  const initial = username ? username.slice(0, 1).toUpperCase() : "?";

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="glass-strong sticky top-0 z-30 w-full"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          aria-label="Flowsilk home"
        >
          <svg
            width="24"
            height="20"
            viewBox="0 0 28 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M1.04356 6.35771L13.6437 0.666504L26.2438 6.35771L13.6437 12.0489L1.04356 6.35771Z"
              fill="#7b39fc"
            />
            <path
              d="M1.04356 9.80249L12.0937 14.7933V23.3335L1.04356 18.3427V9.80249Z"
              fill="white"
            />
            <path
              d="M26.2438 9.80249L15.1937 14.7933V23.3335L26.2438 18.3427V9.80249Z"
              fill="white"
            />
          </svg>
          <span className="font-[family-name:var(--font-manrope)] text-[15px] font-bold tracking-tight text-white hidden sm:block">
            Flowsilk
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              active === item.key || pathname?.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`relative rounded-lg px-3.5 py-2 font-[family-name:var(--font-manrope)] text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute bottom-0 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-[#7b39fc]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {right}

          {/* User avatar */}
          {username && (
            <div className="hidden items-center gap-2.5 md:flex">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7b39fc] text-[12px] font-semibold text-white ring-2 ring-[#7b39fc]/30"
                title={username}
              >
                {initial}
              </div>
              <span className="max-w-[100px] truncate font-[family-name:var(--font-inter)] text-[13px] font-medium text-white/60">
                {username}
              </span>
            </div>
          )}

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="hidden rounded-lg p-2 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-red-400 md:flex"
            title="Logout"
          >
            <LogOut size={16} />
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="text-white transition-opacity hover:opacity-80 md:hidden"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black md:hidden">
          <div className="flex items-center justify-between px-6 py-3">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              onClick={() => setMobileOpen(false)}
            >
              <svg
                width="24"
                height="20"
                viewBox="0 0 28 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M1.04356 6.35771L13.6437 0.666504L26.2438 6.35771L13.6437 12.0489L1.04356 6.35771Z"
                  fill="#7b39fc"
                />
                <path
                  d="M1.04356 9.80249L12.0937 14.7933V23.3335L1.04356 18.3427V9.80249Z"
                  fill="white"
                />
                <path
                  d="M26.2438 9.80249L15.1937 14.7933V23.3335L26.2438 18.3427V9.80249Z"
                  fill="white"
                />
              </svg>
              <span className="font-[family-name:var(--font-manrope)] text-[15px] font-bold tracking-tight text-white">
                Flowsilk
              </span>
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="text-white transition-opacity hover:opacity-80"
            >
              <X size={22} />
            </button>
          </div>

          <nav className="mt-6 flex flex-col gap-1 px-6" aria-label="Mobile">
            {NAV_ITEMS.map((item, i) => {
              const isActive =
                active === item.key || pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`animate-rise rounded-xl px-4 py-3.5 font-[family-name:var(--font-manrope)] text-lg font-medium transition-colors ${
                    isActive
                      ? "bg-[#7b39fc]/10 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                  style={{ animationDelay: `${80 + i * 60}ms` }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div
            className="animate-rise mt-auto flex flex-col gap-3 px-6 pb-8"
            style={{ animationDelay: "300ms" }}
          >
            {username && (
              <div className="flex items-center gap-3 rounded-xl bg-[#1a1a1a] px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7b39fc] text-sm font-semibold text-white">
                  {initial}
                </div>
                <span className="truncate text-sm font-medium text-white/70">
                  {username}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className="w-full rounded-xl border border-white/10 py-3.5 text-center font-[family-name:var(--font-manrope)] text-[14px] font-semibold text-red-400 transition-colors hover:bg-red-400/10"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </motion.header>
  );
}