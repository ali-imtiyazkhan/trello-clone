"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  // { label: "Boards", href: "/boards" },
  { label: "Organization", href: "/organization" },
  { label: "Profile", href: "/profile" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="relative z-20 w-full bg-transparent">
      <div className="animate-fade flex w-full items-center px-6 py-[16px] lg:px-[120px]">
        <Logo />

        <nav
          className="ml-12 hidden items-center gap-8 lg:flex"
          aria-label="Primary"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-1 font-[family-name:var(--font-manrope)] text-[14px] font-medium text-white transition-opacity hover:opacity-80"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <Link
            href="/signin"
            className="rounded-[8px] border border-[#d4d4d4] bg-white px-4 py-2 font-[family-name:var(--font-manrope)] text-[14px] font-semibold text-[#171717] transition-colors hover:bg-[#f1f1f1]"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-[8px] bg-[#7b39fc] px-4 py-2 font-[family-name:var(--font-manrope)] text-[14px] font-semibold text-[#fafafa] shadow-[0_4px_16px_rgba(123,57,252,0.4)] transition-colors hover:bg-[#8d53ff]"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="ml-auto text-white transition-opacity hover:opacity-80 lg:hidden"
        >
          <Menu size={26} />
        </button>
      </div>

      {menuOpen && (
        <div className="animate-fade fixed inset-0 z-50 flex flex-col bg-black lg:hidden">
          <div className="flex items-center justify-between px-6 py-[16px]">
            <Logo />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="text-white transition-opacity hover:opacity-80"
            >
              <X size={26} />
            </button>
          </div>

          <nav className="mt-10 flex flex-col gap-2 px-6" aria-label="Mobile">
            {NAV_ITEMS.map((item, i) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="animate-rise flex items-center justify-between border-b border-white/10 py-4 font-[family-name:var(--font-manrope)] text-2xl font-medium text-white transition-opacity hover:opacity-80"
                style={{ animationDelay: `${80 + i * 60}ms` }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div
            className="animate-rise mt-auto flex flex-col gap-3 px-6 pb-10"
            style={{ animationDelay: "360ms" }}
          >
            <Link
              href="/signin"
              onClick={() => setMenuOpen(false)}
              className="w-full rounded-[8px] border border-[#d4d4d4] bg-white py-3.5 text-center font-[family-name:var(--font-manrope)] text-[14px] font-semibold text-[#171717] transition-colors hover:bg-[#f1f1f1]"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="w-full rounded-[8px] bg-[#7b39fc] py-3.5 text-center font-[family-name:var(--font-manrope)] text-[14px] font-semibold text-[#fafafa] shadow-[0_4px_16px_rgba(123,57,252,0.4)] transition-colors hover:bg-[#8d53ff]"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}