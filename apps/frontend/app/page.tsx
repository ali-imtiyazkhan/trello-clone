import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="sticky top-0 z-10 bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-white text-sm font-bold">
              T
            </span>
            <span className="text-lg font-semibold tracking-tight">Trello Clone</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
            <Link href="/boards" className="hover:text-text-primary transition-colors">
              Boards
            </Link>
            <Link href="/organization" className="hover:text-text-primary transition-colors">
              Organization
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="text-sm font-medium text-text-primary hover:opacity-70 transition-opacity"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary-hover transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
            Plan. Track. Ship.
          </h1>
          <p className="mt-5 text-lg text-text-secondary max-w-xl mx-auto">
            Organize boards, sections, and issues with your team - simple, fast, and clean.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-primary-hover transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/boards"
              className="px-6 py-3 rounded-md font-medium border border-border hover:bg-background transition-colors"
            >
              View boards
            </Link>
          </div>

          <div className="mt-16 max-w-3xl mx-auto bg-surface border border-border rounded-xl shadow-sm p-6 flex gap-4">
            {["To Do", "In Progress", "Done"].map((column, index) => (
              <div key={column} className="flex-1 bg-background rounded-lg p-3">
                <p className="text-xs font-medium text-text-secondary mb-3">{column}</p>
                <div className="space-y-2">
                  <div className="bg-surface border border-border rounded-md p-3 text-left text-sm">
                    Design landing page
                  </div>
                  {index === 1 && (
                    <div className="bg-surface border border-border rounded-md p-3 text-left text-sm">
                      Build sections API
                    </div>
                  )}
                  {index === 2 && (
                    <div className="bg-surface border border-border rounded-md p-3 text-left text-sm">
                      Ship v1.0
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-lg font-semibold">Trello Clone</p>
              <p className="text-sm text-text-secondary mt-1">A clean board for your team.</p>
            </div>
            <div className="flex gap-8 text-sm text-text-secondary">
              <Link href="/signin" className="hover:text-text-primary transition-colors">
                Sign in
              </Link>
              <Link href="/signup" className="hover:text-text-primary transition-colors">
                Sign up
              </Link>
              <Link href="/boards" className="hover:text-text-primary transition-colors">
                Boards
              </Link>
              <Link href="/organization" className="hover:text-text-primary transition-colors">
                Organization
              </Link>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-text-secondary">
            © 2026 Trello Clone. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}