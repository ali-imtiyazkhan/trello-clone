"use client";

import { motion } from "motion/react";
import { BrainCircuit, MessageSquare, Radio, Sparkles, UserCheck, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Skill-Based Auto-Assignment",
    description:
      "Our intelligent scoring engine evaluates required task skills against team member capabilities, assigning the highest-precision match instantly.",
    tag: "AI Matching",
  },
  {
    icon: Radio,
    title: "Real-Time WebSocket Sync",
    description:
      "Collaborate seamlessly with zero latency. Card movements, section renames, and new tasks update in real time across all active viewers.",
    tag: "Live Engine",
  },
  {
    icon: Sparkles,
    title: "GitHub & Resume Extraction",
    description:
      "Connect your GitHub username or upload your CV to automatically map technical skills and experience levels into your profile.",
    tag: "Automated",
  },
  {
    icon: MessageSquare,
    title: "In-Context Team Chat",
    description:
      "Discuss tasks directly on individual card comment threads or jump into the real-time board chat room without switching tabs.",
    tag: "Collaboration",
  },
  {
    icon: UserCheck,
    title: "Transparent Match Reasoning",
    description:
      "Every suggestion shows matched skill percentages, precision metrics, and current developer workload for complete visibility.",
    tag: "Analytics",
  },
  {
    icon: Zap,
    title: "Lightning-Fast Kanban",
    description:
      "Built with high-performance dark theme UI, keyboard-friendly flows, and instant drag-and-drop across custom workflow sections.",
    tag: "Productivity",
  },
];

export default function Features() {
  return (
    <section className="relative z-10 bg-black/60 py-24 backdrop-blur-xl border-y border-white/[0.06]">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#7b39fc]/30 bg-[#7b39fc]/10 px-3 py-1 text-xs font-semibold text-[#a87aff]">
            <Sparkles size={12} />
            Engineered for Modern Engineering Teams
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-white md:text-5xl">
            Everything you need to ship projects with zero friction.
          </h2>
          <p className="mt-4 text-base text-white/60">
            Combine Kanban project management with real-time intelligence and
            automated skill-based assignment.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative rounded-2xl border border-white/10 bg-[#141414] p-6 transition-all duration-300 hover:border-[#7b39fc]/40 hover:bg-[#181818] hover:shadow-[0_8px_30px_rgba(123,57,252,0.12)]"
              >
                {/* Top badge */}
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7b39fc]/10 text-[#7b39fc] transition-colors group-hover:bg-[#7b39fc] group-hover:text-white">
                    <Icon size={20} />
                  </div>
                  <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/50">
                    {feature.tag}
                  </span>
                </div>

                <h3 className="mt-5 font-[family-name:var(--font-manrope)] text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
