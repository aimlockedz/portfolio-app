"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Briefcase,
  History,
  TrendingUp,
  BookOpen,
  Newspaper,
  User,
  Settings,
  LogOut,
  Network,
  Bell,
  CalendarDays,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/transactions", label: "Transactions", icon: History },
  { href: "/watchlist", label: "Watchlist", icon: TrendingUp },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/alerts", label: "Price Alerts", icon: Bell },
  { href: "/earnings", label: "Earnings", icon: CalendarDays },
  { href: "/exposure", label: "Exposure", icon: Network },
];

const bottomItems = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-lg hover:bg-[var(--surface-container-high)] transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-[var(--surface-container-low)] transform transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-[var(--primary-foreground)]" />
            </div>
            <div>
              <h2 className="font-bold text-sm">StockPortfolio</h2>
              <p className="text-[10px] text-[var(--on-surface-variant)]">Your portfolio is growing</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg hover:bg-[var(--surface-container-high)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? "bg-[var(--card)] text-[var(--primary)] shadow-sm font-bold"
                    : "text-[var(--on-surface-variant)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
                }`}
              >
                <item.icon className={`h-[18px] w-[18px] ${isActive ? "text-[var(--primary)]" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom items */}
        <div className="border-t border-[var(--border)] p-3 space-y-1">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? "bg-[var(--card)] text-[var(--primary)] shadow-sm font-bold"
                    : "text-[var(--on-surface-variant)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-[var(--on-surface-variant)] hover:bg-[var(--card)] hover:text-[var(--foreground)] transition-all w-full"
            >
              <LogOut className="h-[18px] w-[18px]" />
              <span>Logout</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
