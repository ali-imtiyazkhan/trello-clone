"use client";

import { Circle, Eye, EyeOff } from "lucide-react";
import { motion, type Variants } from "motion/react";
import { useState } from "react";

function GoogleLogo() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.4 1.62 14.94.5 12 .5 7.56.5 3.72 3.12 1.92 6.84l3.66 2.84C6.72 6.72 9.12 5.04 12 5.04z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.84-.08-1.64-.22-2.41H12v4.56h6.45c-.28 1.5-1.12 2.77-2.38 3.62l3.66 2.83c2.13-1.96 3.77-4.86 3.77-8.6z"
      />
      <path
        fill="#FBBC05"
        d="M5.58 14.32a7.12 7.12 0 0 1 0-4.64L1.92 6.84a11.5 11.5 0 0 0 0 10.32l3.66-2.84z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.1 0 5.7-1.03 7.6-2.78l-3.66-2.83c-1.01.69-2.3 1.09-3.94 1.09-2.88 0-5.28-1.68-6.42-4.2l-3.66 2.84C3.72 20.88 7.56 23.5 12 23.5z"
      />
    </svg>
  );
}

function GithubLogo() {
  return (
    <svg
      className="h-4 w-4 fill-white"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.11-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.35.78 1.05.78 2.12v3.14c0 .3.21.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

const heroContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

type Step = { number: number; text: string; active?: boolean };

export default function AuthShell({
  title,
  subtitle,
  steps,
  children,
}: {
  title: string;
  subtitle: string;
  steps: Step[];
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen w-full bg-black p-2 font-[family-name:var(--font-inter)] text-white selection:bg-white/30 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4">
      <section className="hidden lg:flex relative w-[52%] flex-col items-center justify-end pb-32 px-12 rounded-3xl overflow-hidden shadow-2xl h-full">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/aurora-video.mp4" type="video/mp4" />
        </video>

        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          className="z-10 w-full max-w-xs space-y-8"
        >
          <motion.div
            variants={heroItem}
            className="flex items-center justify-center gap-2"
          >
            <Circle
              className="h-5 w-5 fill-white text-white"
              aria-hidden="true"
            />
            <span className="text-xl font-semibold tracking-tight">
              Flowsilk
            </span>
          </motion.div>

          <motion.div variants={heroItem} className="space-y-3 text-center">
            <h1 className="text-4xl font-medium tracking-tight whitespace-nowrap">
              {title}
            </h1>
            <p className="text-white/60 text-sm leading-relaxed px-4">
              {subtitle}
            </p>
          </motion.div>

          <div className="space-y-3">
            {steps.map((step) => (
              <motion.div key={step.number} variants={heroItem}>
                <StepItem
                  number={step.number}
                  text={step.text}
                  active={step.active}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="flex-1 flex flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-xl space-y-8 lg:space-y-6 sm:space-y-10"
        >
          {children}
        </motion.div>
      </section>
    </main>
  );
}

export function StepItem({
  number,
  text,
  active = false,
}: {
  number: number;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-colors duration-300 ${
        active
          ? "bg-white text-black border border-white"
          : "bg-[#1a1a1a] text-white border-none"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          active ? "bg-black text-white" : "bg-white/10 text-white/40"
        }`}
      >
        {number}
      </span>
      {text}
    </div>
  );
}

export function SocialButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 items-center justify-center gap-2.5 bg-black border border-white/10 rounded-xl hover:bg-white/5 text-sm font-medium text-white transition-colors duration-200"
    >
      {icon}
      {label}
    </button>
  );
}

export function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <SocialButton icon={<GoogleLogo />} label="Google" onClick={onClick} />
  );
}

export function GithubButton({ onClick }: { onClick: () => void }) {
  return (
    <SocialButton icon={<GithubLogo />} label="GitHub" onClick={onClick} />
  );
}

export function OrDivider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-black px-4 text-xs font-medium text-white/40 uppercase tracking-widest">
          Or
        </span>
      </div>
    </div>
  );
}

export function InputGroup({
  label,
  placeholder,
  type,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-white">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required
        placeholder={placeholder}
        className="w-full bg-[#1a1a1a] border-none rounded-xl h-11 px-4 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-shadow duration-200"
      />
    </div>
  );
}

export function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
  hint,
  minLength = 8,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
  hint?: string;
  minLength?: number;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-white">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          minLength={minLength}
          required
          autoComplete={label === "Password" ? "current-password" : "new-password"}
          className="w-full bg-[#1a1a1a] border-none rounded-xl h-11 px-4 pr-12 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-white/20 transition-shadow duration-200"
        />
        <button
          type="button"
          onClick={() => setShowPassword((visible) => !visible)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors duration-200"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {hint && <p className="text-xs text-white/30">{hint}</p>}
    </div>
  );
}