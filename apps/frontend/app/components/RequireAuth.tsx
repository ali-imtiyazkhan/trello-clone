"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/signin");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black">
        {/* Animated spinner ring */}
        <div className="relative mb-6">
          <div className="h-10 w-10 rounded-full border-2 border-white/10" />
          <div className="animate-spin-slow absolute inset-0 h-10 w-10 rounded-full border-2 border-transparent border-t-[#7b39fc]" />
        </div>
        {/* Logo text */}
        <div className="flex items-center gap-2">
          <svg
            width="20"
            height="17"
            viewBox="0 0 28 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M1.04356 6.35771L13.6437 0.666504L26.2438 6.35771L13.6437 12.0489L1.04356 6.35771Z"
              fill="#7b39fc"
            />
            <path
              d="M1.04356 9.80249L12.0937 14.7933V23.3335L1.04356 18.3427V9.80249Z"
              fill="white"
            />
            <path
              d="M26.2438 9.80249L15.1937 14.7933V23.3335L26.2438 18.3427V9.80249Z"
              fill="white"
            />
          </svg>
          <span className="font-[family-name:var(--font-manrope)] text-sm font-semibold tracking-tight text-white/40">
            Flowsilk
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}