import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--surface)]">
      {/* Header */}
      <header className="px-6 lg:px-10 h-16 flex items-center">
        <Link className="font-[var(--font-headline)] font-bold text-xl" href="#">
          StockPortfolio
        </Link>
        <nav className="ml-auto flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="rounded-full text-sm font-medium px-5">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button className="rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 text-sm font-medium px-5">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center">
        <section className="w-full py-16 md:py-24 lg:py-32">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-container)] px-4 py-1.5 text-sm font-medium text-[var(--primary)]">
              <TrendingUp className="h-4 w-4" />
              Free Portfolio Tracker
            </div>

            <h1 className="font-[var(--font-headline)] text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Your Personal Investment
              <br />
              <span className="text-[var(--primary)]">Control Tower</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg text-[var(--on-surface-variant)]">
              Track your portfolio, manage transactions, and make smarter
              allocation decisions. Real-time prices powered by Finnhub.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link href="/register">
                <Button className="rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 h-12 px-8 text-base font-bold">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="rounded-full border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-container)] h-12 px-8 text-base font-bold">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-4 pt-12 max-w-3xl mx-auto">
              <div className="rounded-2xl bg-[var(--card)] p-6 shadow-[0_2px_32px_rgba(0,0,0,0.04)] text-left">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-container)] flex items-center justify-center mb-4">
                  <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <h3 className="font-[var(--font-headline)] font-bold mb-1">Live Prices</h3>
                <p className="text-sm text-[var(--on-surface-variant)]">
                  Real-time market data for all your holdings
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--card)] p-6 shadow-[0_2px_32px_rgba(0,0,0,0.04)] text-left">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-container)] flex items-center justify-center mb-4">
                  <Shield className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <h3 className="font-[var(--font-headline)] font-bold mb-1">P&L Tracking</h3>
                <p className="text-sm text-[var(--on-surface-variant)]">
                  Know your gains and losses at a glance
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--card)] p-6 shadow-[0_2px_32px_rgba(0,0,0,0.04)] text-left">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-container)] flex items-center justify-center mb-4">
                  <Zap className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <h3 className="font-[var(--font-headline)] font-bold mb-1">Smart Search</h3>
                <p className="text-sm text-[var(--on-surface-variant)]">
                  Find any stock with symbol autocomplete
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 text-center">
        <p className="text-xs text-[var(--on-surface-variant)]">
          &copy; 2026 StockPortfolio. Built with Next.js &amp; Turso.
        </p>
      </footer>
    </div>
  );
}
