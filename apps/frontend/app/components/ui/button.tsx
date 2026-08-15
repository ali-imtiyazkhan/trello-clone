import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "white";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[#7b39fc] text-white shadow-[0_4px_16px_rgba(123,57,252,0.35)] hover:bg-[#8d53ff] hover:-translate-y-0.5 active:translate-y-0",
  secondary:
    "border border-white/10 bg-[#1a1a1a] text-white/80 hover:border-white/20 hover:text-white",
  ghost:
    "text-white/60 hover:bg-white/[0.06] hover:text-white",
  danger:
    "bg-red-500/90 text-white hover:bg-red-500",
  white:
    "bg-white text-black hover:bg-white/90 active:scale-[0.98]",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  loading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
