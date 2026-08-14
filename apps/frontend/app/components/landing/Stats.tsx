"use client";

import { motion } from "motion/react";

const STATS = [
  { value: "100%", label: "Real-time WebSocket Sync" },
  { value: "150+", label: "Indexed Technical Skills" },
  { value: "< 20ms", label: "Auto-Match Response Time" },
  { value: "0", label: "Manual Triage Overhead" },
];

export default function Stats() {
  return (
    <section className="relative z-10 border-y border-white/[0.08] bg-[#0c0c10]/80 py-16 backdrop-blur-md">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center"
            >
              <div className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold text-white md:text-5xl">
                <span className="bg-gradient-to-r from-white via-white to-[#a87aff] bg-clip-text text-transparent">
                  {stat.value}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-white/50 sm:text-sm">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
