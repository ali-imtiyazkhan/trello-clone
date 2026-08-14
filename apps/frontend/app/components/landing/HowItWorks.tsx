"use client";

import { motion } from "motion/react";
import { ArrowRight, CheckCircle, FileText, Layers, Zap } from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    step: "01",
    title: "Build Your Skill Fingerprint",
    description:
      "Connect your GitHub handle or drop a resume PDF. The system automatically indexes your language proficiencies, frameworks, and tools.",
    badge: "Automated Onboarding",
  },
  {
    step: "02",
    title: "Create Boards & Define Tasks",
    description:
      "Organize sprints by sections. Write task descriptions and our algorithm auto-detects required technical proficiencies like React, Docker, or GraphQL.",
    badge: "Smart Task Creation",
  },
  {
    step: "03",
    title: "Match, Collaborate & Ship",
    description:
      "Click 'Suggest Assignee' to evaluate precision rankings, assign cards, and watch the entire team stay synchronized in real time.",
    badge: "Zero-Latency Shipping",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative z-10 py-24">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white/50">
            Workflow
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-white md:text-5xl">
            From setup to shipping in 3 steps
          </h2>
          <p className="mt-3 text-sm text-white/60">
            Eliminate manual task triage and start building with optimal developer alignment.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative rounded-2xl border border-white/10 bg-[#121212] p-6"
            >
              {/* Step number badge */}
              <div className="flex items-center justify-between">
                <span className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold text-[#7b39fc]">
                  {s.step}
                </span>
                <span className="rounded-md bg-[#7b39fc]/10 px-2 py-0.5 text-[11px] font-semibold text-[#a87aff]">
                  {s.badge}
                </span>
              </div>

              <h3 className="mt-6 font-[family-name:var(--font-manrope)] text-lg font-bold text-white">
                {s.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-white/50">
                {s.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
