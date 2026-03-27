"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface EarningsEvent {
  symbol: string;
  date: string;
  hour: string; // bmo, amc, dmh
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  quarter: number;
  year: number;
}

const HOUR_LABELS: Record<string, string> = {
  bmo: "Before Open",
  amc: "After Close",
  dmh: "During Market",
};

const HOUR_ICONS: Record<string, string> = {
  bmo: "🌅",
  amc: "🌙",
  dmh: "☀️",
};

function getWeekRange(offset: number) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return {
    from: monday.toISOString().split("T")[0],
    to: friday.toISOString().split("T")[0],
    label: `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${friday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
  };
}

export function EarningsCalendar() {
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [week, setWeek] = useState(getWeekRange(0));

  useEffect(() => {
    const w = getWeekRange(weekOffset);
    setWeek(w);
    setLoading(true);

    fetch(`/api/market/earnings?from=${w.from}&to=${w.to}`)
      .then((r) => r.json())
      .then((d) => setEarnings(d.earnings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [weekOffset]);

  // Group by date
  const grouped: Record<string, EarningsEvent[]> = {};
  earnings.forEach((e) => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });

  const sortedDates = Object.keys(grouped).sort();

  // Day names
  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((p) => p - 1)}
          className="p-2 rounded-full hover:bg-[var(--surface-container-high)] transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="font-bold text-sm">{week.label}</p>
          <p className="text-[10px] text-[var(--on-surface-variant)]">
            {weekOffset === 0 ? "This Week" : weekOffset === 1 ? "Next Week" : weekOffset === -1 ? "Last Week" : ""}
          </p>
        </div>
        <button
          onClick={() => setWeekOffset((p) => p + 1)}
          className="p-2 rounded-full hover:bg-[var(--surface-container-high)] transition-all"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--primary)] border-t-transparent" />
        </div>
      ) : earnings.length === 0 ? (
        <div className="text-center py-12 text-[var(--on-surface-variant)]">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No earnings this week</p>
          <p className="text-sm mt-1">Try navigating to a different week.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => {
            const events = grouped[date];
            // Sort: bmo first, then dmh, then amc
            const order = { bmo: 0, dmh: 1, amc: 2 };
            events.sort((a, b) => (order[a.hour as keyof typeof order] ?? 1) - (order[b.hour as keyof typeof order] ?? 1));

            return (
              <div key={date} className="rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
                <div className="px-5 py-3 bg-[var(--surface-container-low)] border-b border-[var(--border)]">
                  <p className="font-bold text-sm">{getDayName(date)}</p>
                  <p className="text-[10px] text-[var(--on-surface-variant)]">{events.length} companies reporting</p>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {events.slice(0, 30).map((e, idx) => {
                    const beat = e.epsActual !== null && e.epsEstimate !== null && e.epsActual > e.epsEstimate;
                    const miss = e.epsActual !== null && e.epsEstimate !== null && e.epsActual < e.epsEstimate;

                    return (
                      <div key={`${e.symbol}-${idx}`} className="flex items-center justify-between px-5 py-2.5 hover:bg-[var(--surface-container-low)] transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--primary-container)] flex items-center justify-center text-[10px] font-bold text-[var(--primary)]">
                            {e.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-sm">{e.symbol}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px]">{HOUR_ICONS[e.hour] || "📅"}</span>
                              <span className="text-[10px] text-[var(--on-surface-variant)]">
                                {HOUR_LABELS[e.hour] || e.hour}
                              </span>
                              {e.quarter && (
                                <span className="text-[10px] text-[var(--on-surface-variant)]">
                                  · Q{e.quarter} {e.year}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          {e.epsEstimate !== null && (
                            <div>
                              <p className="text-[10px] text-[var(--on-surface-variant)]">EPS Est.</p>
                              <p className="text-sm font-semibold">${e.epsEstimate?.toFixed(2)}</p>
                            </div>
                          )}
                          {e.epsActual !== null && (
                            <div>
                              <p className="text-[10px] text-[var(--on-surface-variant)]">Actual</p>
                              <p className={`text-sm font-bold ${beat ? "text-emerald-400" : miss ? "text-red-400" : ""}`}>
                                ${e.epsActual?.toFixed(2)}
                              </p>
                            </div>
                          )}
                          {beat && <TrendingUp className="h-4 w-4 text-emerald-400" />}
                          {miss && <TrendingDown className="h-4 w-4 text-red-400" />}
                          {e.epsActual === null && (
                            <Clock className="h-4 w-4 text-[var(--on-surface-variant)] opacity-40" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {events.length > 30 && (
                    <div className="px-5 py-2 text-center text-[10px] text-[var(--on-surface-variant)]">
                      +{events.length - 30} more companies
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
