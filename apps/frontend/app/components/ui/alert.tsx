import { type ReactNode } from "react";
import { motion } from "motion/react";

type AlertProps = {
  children: ReactNode;
  variant?: "error" | "success" | "info";
  className?: string;
};

const VARIANTS = {
  error: "border-red-400/20 bg-red-400/10 text-red-400",
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
  info: "border-[#7b39fc]/20 bg-[#7b39fc]/10 text-[#a87aff]",
};

export function Alert({
  children,
  variant = "error",
  className = "",
}: AlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-3.5 text-sm ${VARIANTS[variant]} ${className}`}
      role="alert"
    >
      {children}
    </motion.div>
  );
}
