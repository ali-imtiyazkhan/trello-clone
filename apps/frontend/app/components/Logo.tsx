import Link from "next/link";

type LogoProps = {
  variant?: "light" | "dark";
  showText?: boolean;
  className?: string;
};

export default function Logo({
  variant = "light",
  showText = true,
  className = "",
}: LogoProps) {
  const topFill = variant === "light" ? "white" : "#7b39fc";
  const sideFill = variant === "light" ? "white" : "white";

  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 transition-opacity hover:opacity-80 ${className}`}
      aria-label="Flowsilk home"
    >
      <svg
        width="28"
        height="24"
        viewBox="0 0 28 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M1.04356 6.35771L13.6437 0.666504L26.2438 6.35771L13.6437 12.0489L1.04356 6.35771Z"
          fill={topFill}
        />
        <path
          d="M1.04356 9.80249L12.0937 14.7933V23.3335L1.04356 18.3427V9.80249Z"
          fill={sideFill}
        />
        <path
          d="M26.2438 9.80249L15.1937 14.7933V23.3335L26.2438 18.3427V9.80249Z"
          fill={sideFill}
        />
      </svg>
      {showText && (
        <span className="font-[family-name:var(--font-manrope)] text-[15px] font-bold tracking-tight text-white">
          Flowsilk
        </span>
      )}
    </Link>
  );
}
