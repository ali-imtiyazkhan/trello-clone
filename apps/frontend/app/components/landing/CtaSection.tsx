"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="relative z-10 py-24">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-[#2b1f48] via-[#1a142c] to-[#100d1c] px-8 py-16 text-center shadow-[0_20px_80px_rgba(123,57,252,0.2)] md:px-16 md:py-20"
        >
          {/* Ambient light glow */}
          <div className="absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[#7b39fc]/40 blur-3xl" />

          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <Sparkles size={13} className="text-[#a87aff]" />
            Free for teams
          </div>

          <h2 className="mx-auto mt-6 max-w-2xl font-[family-name:var(--font-manrope)] text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            Start organizing and auto-matching tasks today.
          </h2>

          <p className="mx-auto mt-4 max-w-lg text-base text-white/70">
            Create an organization, connect your skill profile, and ship your
            next milestone with effortless team precision.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-[family-name:var(--font-cabin)] text-sm font-bold text-black transition-all duration-200 hover:bg-white/90 hover:scale-105 active:scale-100"
            >
              Get Started for Free
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/signin"
              className="rounded-xl border border-white/20 bg-white/[0.04] px-7 py-3.5 font-[family-name:var(--font-cabin)] text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
