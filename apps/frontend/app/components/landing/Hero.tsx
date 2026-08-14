import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative z-10 mt-32 flex flex-col items-center px-6 pb-28 text-center">
      <div
        className="animate-rise flex h-[38px] items-center gap-2.5 rounded-[10px] border border-[rgba(164,132,215,0.5)] bg-[rgba(85,80,110,0.4)] py-1 pl-1.5 pr-4 backdrop-blur-md"
        style={{ animationDelay: "100ms" }}
      >
        <span className="rounded-[6px] bg-[#7b39fc] px-2.5 py-1 font-[family-name:var(--font-cabin)] text-[13px] font-medium leading-none text-white">
          New
        </span>
        <span className="font-[family-name:var(--font-cabin)] text-[14px] font-medium text-white">
          Skill-based auto-assignment is here
        </span>
      </div>

      <h1
        className="animate-rise mt-7 max-w-[1024px] font-[family-name:var(--font-instrument)] text-5xl/[1.1] text-white md:text-7xl/[1.1] lg:text-[96px]/[1.1]"
        style={{ animationDelay: "220ms" }}
      >
        Ship your best projects
        <br className="hidden sm:block" /> instantly{" "}
        <em className="mx-2 italic lg:mx-3">and</em> hassle-free
      </h1>

      <p
        className="animate-rise mt-6 max-w-[662px] font-[family-name:var(--font-inter)] text-[18px] font-normal leading-relaxed text-white/70"
        style={{ animationDelay: "340ms" }}
      >
        Organize boards, sections, and cards with your team. The matching engine
        reads every member&apos;s skills and puts each task in the right hands —
        with a reason you can see.
      </p>

      <div
        className="animate-rise mt-10 flex flex-col gap-4 sm:flex-row"
        style={{ animationDelay: "460ms" }}
      >
        <Link
          href="/signup"
          className="rounded-[10px] bg-[#7b39fc] px-7 py-3.5 font-[family-name:var(--font-cabin)] text-[16px] font-medium text-white shadow-[0_8px_28px_rgba(123,57,252,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#8d53ff] active:translate-y-0"
        >
          Get Started
        </Link>
        <Link
          href="/boards"
          className="rounded-[10px] bg-[#2b2344] px-7 py-3.5 font-[family-name:var(--font-cabin)] text-[16px] font-medium text-[#f6f7f9] shadow-[0_8px_28px_rgba(20,12,40,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#3a2f5a] active:translate-y-0"
        >
          View Boards
        </Link>
      </div>
    </section>
  );
}