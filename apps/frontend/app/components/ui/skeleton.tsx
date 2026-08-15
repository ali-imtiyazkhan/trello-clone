import { type ReactNode } from "react";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer rounded-xl bg-white/[0.06] ${className}`}
      aria-hidden="true"
    />
  );
}

export function BoardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div className="flex gap-5 overflow-hidden pb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="w-72 shrink-0 space-y-3 rounded-2xl border border-white/10 bg-[#141414] p-3.5"
        >
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-9" />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40" />
      <Skeleton className="h-56" />
      <Skeleton className="h-72" />
    </div>
  );
}

export function PageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="relative mb-6">
        <div className="h-10 w-10 rounded-full border-2 border-white/10" />
        <div className="animate-spin-slow absolute inset-0 h-10 w-10 rounded-full border-2 border-transparent border-t-[#7b39fc]" />
      </div>
      <span className="font-[family-name:var(--font-manrope)] text-sm text-white/40">
        {label}
      </span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#1a1a1a]">
        {icon}
      </div>
      <h2 className="font-[family-name:var(--font-manrope)] text-lg font-semibold text-white">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-white/40">{description}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
