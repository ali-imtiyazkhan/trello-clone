"use client";

import { motion } from "motion/react";
import { CheckCircle2, MessageSquare, Sparkles, UserCheck, Zap } from "lucide-react";

export default function BoardPreview() {
  return (
    <section className="relative z-10 mx-auto -mt-12 max-w-[1200px] px-6 pb-24 lg:px-8">
      {/* Glow effect behind the board preview */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[350px] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7b39fc]/20 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-strong rounded-3xl border border-white/15 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl md:p-6"
      >
        {/* Mockup Window Top bar */}
        <div className="mb-5 flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56]/80" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e]/80" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f]/80" />
            </div>
            <span className="ml-3 hidden font-[family-name:var(--font-manrope)] text-xs font-medium text-white/40 sm:inline-block">
              app.trelloclone.com/boards/engineering-sprint
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Real-time Active (3 online)
            </div>
          </div>
        </div>

        {/* Mockup Kanban Board */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Column 1: Backlog */}
          <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-manrope)] text-xs font-semibold text-white/90">
                  Backlog
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                  2
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80 p-3 shadow-sm transition-all hover:border-white/20">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-white">
                    Setup WebSocket Server
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-white/40">
                  Implement pub/sub rooms for live board subscriptions
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex gap-1">
                    <span className="rounded bg-[#7b39fc]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#a87aff]">
                      WebSocket
                    </span>
                    <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-blue-400">
                      TypeScript
                    </span>
                  </div>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7b39fc] text-[9px] font-bold text-white">
                    A
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80 p-3 shadow-sm transition-all hover:border-white/20">
                <span className="text-xs font-semibold text-white">
                  Prisma schema migration
                </span>
                <p className="mt-1 text-[11px] text-white/40">
                  Add skill weight and user metrics model
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
                    PostgreSQL
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-white/40">
                    <MessageSquare size={11} /> 3
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: In Progress (Highlighted AI Matching) */}
          <div className="rounded-2xl border border-[#7b39fc]/30 bg-gradient-to-b from-[#7b39fc]/[0.08] to-transparent p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-manrope)] text-xs font-semibold text-[#a87aff]">
                  In Progress
                </span>
                <span className="rounded-full bg-[#7b39fc]/20 px-2 py-0.5 text-[10px] font-medium text-[#a87aff]">
                  1 Active
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#7b39fc]/40 bg-[#1e1730] p-3 shadow-[0_4px_20px_rgba(123,57,252,0.15)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Resume Parser NLP
                </span>
                <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <Sparkles size={10} /> 98% Match
                </span>
              </div>

              <p className="mt-1 text-[11px] text-white/50">
                Extract candidate skills from PDF and rank against task
              </p>

              {/* AI Auto-assign breakdown */}
              <div className="mt-2.5 rounded-lg border border-white/[0.08] bg-black/40 p-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/50">AI Auto-Assigned to:</span>
                  <span className="font-semibold text-white flex items-center gap-1">
                    <UserCheck size={11} className="text-[#7b39fc]" /> Sarah Connor
                  </span>
                </div>
                <div className="mt-1 flex gap-1">
                  <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[8px] font-semibold text-emerald-400">
                    NLP (95%)
                  </span>
                  <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[8px] font-semibold text-emerald-400">
                    Python (90%)
                  </span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between pt-1">
                <span className="flex items-center gap-1 text-[10px] text-white/40">
                  <MessageSquare size={11} /> 5 comments
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                  S
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Shipped */}
          <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-manrope)] text-xs font-semibold text-white/90">
                  Shipped
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                  1
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#1a1a1a]/80 p-3 opacity-80">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <CheckCircle2 size={13} className="text-emerald-400" />
                Auth & GitHub Sync
              </div>
              <p className="mt-1 text-[11px] text-white/40">
                JWT sessions + GitHub repo skills extraction pipeline
              </p>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-purple-400">
                  OAuth
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7b39fc] text-[9px] font-bold text-white">
                  M
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
