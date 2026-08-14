import Link from "next/link";
import Logo from "./Logo";

const NAVIGATION_LINKS = [
  { label: "Home", href: "/" },
  { label: "Boards", href: "/boards" },
  { label: "Organizations", href: "/organization" },
  { label: "Skill Profile", href: "/profile" },
];

const ACCOUNT_LINKS = [
  { label: "Sign In", href: "/signin" },
  { label: "Create Account", href: "/signup" },
];

const FEATURES_LIST = [
  "Skill-Based AI Assignment",
  "Realtime WebSocket Sync",
  "GitHub & Resume Parser",
  "In-Context Board Chat",
  "Team Workload Precision",
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#08080c]">
      <div className="mx-auto max-w-[1200px] px-6 py-14 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <Logo />
            <p className="mt-3 font-[family-name:var(--font-inter)] text-xs leading-relaxed text-white/50">
              Modern Kanban workspace with an intelligent skill-matching engine.
              Organize boards, sections, and tasks with live synchronization.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <p className="font-[family-name:var(--font-manrope)] text-xs font-bold uppercase tracking-wider text-white/40">
              Navigation
            </p>
            <ul className="mt-4 space-y-2.5">
              {NAVIGATION_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-[family-name:var(--font-inter)] text-xs text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div>
            <p className="font-[family-name:var(--font-manrope)] text-xs font-bold uppercase tracking-wider text-white/40">
              Capabilities
            </p>
            <ul className="mt-4 space-y-2.5">
              {FEATURES_LIST.map((feature) => (
                <li
                  key={feature}
                  className="font-[family-name:var(--font-inter)] text-xs text-white/50"
                >
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="font-[family-name:var(--font-manrope)] text-xs font-bold uppercase tracking-wider text-white/40">
              Account
            </p>
            <ul className="mt-4 space-y-2.5">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-[family-name:var(--font-inter)] text-xs text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.08] pt-6 sm:flex-row">
          <p className="font-[family-name:var(--font-inter)] text-xs text-white/40">
            © {new Date().getFullYear()} Trello Clone. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="font-[family-name:var(--font-inter)] text-xs text-white/40">
              Engineered with Next.js, WebSockets & Tailwind
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}