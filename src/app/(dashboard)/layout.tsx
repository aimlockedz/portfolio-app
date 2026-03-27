import { Sidebar } from "@/components/shared/sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-end px-6 py-3 bg-[var(--background)]/80 backdrop-blur-sm border-b border-[var(--border)]">
          <ThemeToggle />
        </header>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
