"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
import { StockSearch } from "./stock-search";

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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col py-8 px-4 gap-2 h-screen w-64 rounded-r-[2rem] overflow-hidden bg-[var(--surface-container-low)] sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-6 mb-8">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-[var(--primary-foreground)]" />
          </div>
        </div>
        <h2 className="font-[var(--font-headline)] font-bold text-lg">
          StockPortfolio
        </h2>
        <p className="text-xs text-[var(--on-surface-variant)] font-medium tracking-wide">
          Your portfolio is growing
        </p>
      </div>

      {/* Stock Search */}
      <StockSearch />

      {/* Main Nav */}
      <nav className="flex-1 flex flex-col gap-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-full font-medium text-sm transition-all ${
                isActive
                  ? "bg-[var(--card)] text-[var(--primary)] shadow-sm font-bold"
                  : "text-[var(--on-surface-variant)] hover:bg-[var(--card)] hover:text-[var(--foreground)] hover:translate-x-0.5"
              }`}
            >
              <item.icon className={`h-[18px] w-[18px] ${isActive ? "text-[var(--primary)]" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="space-y-1.5 pt-4">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-full font-medium text-sm transition-all ${
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
            className="flex items-center gap-3 px-5 py-2.5 rounded-full font-medium text-sm text-[var(--on-surface-variant)] hover:bg-[var(--card)] hover:text-[var(--foreground)] transition-all w-full"
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
