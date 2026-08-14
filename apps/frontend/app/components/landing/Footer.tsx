import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Boards", href: "/boards" },
  { label: "Organization", href: "/organization" },
  { label: "Profile", href: "/profile" },
  { label: "Sign in", href: "/signin" },
  { label: "Sign up", href: "/signup" },
];

const FOOTER_FEATURES = [
  "Skill-based auto-assignment",
  "Realtime board sync",
  "Transparent matching scores",
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[rgba(43,35,68,0.85)] backdrop-blur-md">
      <div className="mx-auto max-w-[1200px] px-6 py-14 lg:px-[120px] lg:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="font-[family-name:var(--font-manrope)] text-lg font-bold tracking-tight text-white">
              Trello Clone
            </p>
            <p className="mt-3 font-[family-name:var(--font-inter)] text-sm leading-relaxed text-white/60">
              Organize boards, sections, and cards with your team. The matching
              engine reads every member&apos;s skills and puts each task in the
              right hands.
            </p>
          </div>

          <div className="flex flex-col gap-10 sm:flex-row sm:gap-16">
            <div>
              <p className="font-[family-name:var(--font-manrope)] text-[13px] font-semibold uppercase tracking-wider text-white/50">
                Links
              </p>
              <ul className="mt-4 space-y-2.5">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-[family-name:var(--font-manrope)] text-sm text-white/80 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-[family-name:var(--font-manrope)] text-[13px] font-semibold uppercase tracking-wider text-white/50">
                Features
              </p>
              <ul className="mt-4 space-y-2.5">
                {FOOTER_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="font-[family-name:var(--font-manrope)] text-sm text-white/80"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="font-[family-name:var(--font-inter)] text-xs text-white/50">
            © 2026 Trello Clone. All rights reserved.
          </p>
          <p className="font-[family-name:var(--font-inter)] text-xs text-white/50">
            Made for teams that ship.
          </p>
        </div>
      </div>
    </footer>
  );
}