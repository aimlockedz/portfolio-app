import Link from "next/link";
import { LayoutDashboard, Briefcase, History, TrendingUp, BookOpen, Newspaper, User, Settings, LogOut, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/transactions", label: "Transactions", icon: History },
  { href: "/rebalance", label: "Rebalance", icon: ArrowRightLeft },
  { href: "/watchlist", label: "Watchlist", icon: TrendingUp },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/news", label: "News", icon: Newspaper },
];

export function Sidebar() {
  return (
    <div className="flex flex-col h-screen w-64 border-r bg-card">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          StockPortfolio
        </Link>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t space-y-2">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" className="w-full justify-start gap-3 px-3" type="submit">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </form>
      </div>
    </div>
  );
}
