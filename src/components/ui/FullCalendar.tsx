"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Trainerize-style calendar: Daily / Weekly / Monthly views with per-event-type
 * filter checkboxes. Pages map their data (appointments, form-check tasks…)
 * into CalendarItems; untimed items (no start time) render in an "all-day"
 * tasks row above the hour grid.
 */
export interface CalendarItem {
  id: string;
  /** ISO date yyyy-mm-dd */
  date: string;
  /** HH:MM — omit for all-day tasks (e.g. form-check assignments) */
  start?: string;
  end?: string;
  title: string;
  sub?: string;
  /** Key into the `kinds` style map */
  kind: string;
  /** Navigate here when the chip is clicked */
  href?: string;
  onRemove?: () => void;
  badge?: string;
}

export interface CalendarKind {
  label: string;
  dot: string;
  chip: string;
}

type View = "daily" | "weekly" | "monthly";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i); // 07:00–19:00

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function weekStartOf(base: Date) {
  const d = new Date(base);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // back to Monday
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
function hourOf(time?: string) {
  return time ? parseInt(time.slice(0, 2), 10) : NaN;
}

function Chip({ item, kinds, compact }: { item: CalendarItem; kinds: Record<string, CalendarKind>; compact?: boolean }) {
  const style = kinds[item.kind];
  const inner = (
    <>
      <div className={cn("truncate font-semibold leading-tight", compact ? "text-[11px]" : "text-xs")}>{item.title}</div>
      {item.start && (
        <div className={cn("mt-0.5 flex items-center gap-1 opacity-80", compact ? "text-[10px]" : "text-[11px]")}>
          <Clock className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
          {item.start}{item.end ? `–${item.end}` : ""}
        </div>
      )}
      {!compact && item.sub && <div className="mt-0.5 truncate text-[10px] opacity-70">{item.sub}</div>}
      {item.badge && (
        <span className="mt-0.5 inline-block rounded bg-black/10 px-1 text-[9px] font-semibold uppercase tracking-wide">
          {item.badge}
        </span>
      )}
    </>
  );
  const className = cn(
    "group/chip relative block w-full rounded-lg border text-left shadow-sm transition hover:shadow-md",
    compact ? "p-1.5" : "p-2",
    style?.chip,
  );
  return (
    <div className="relative">
      {item.href ? (
        <Link href={item.href} className={className}>{inner}</Link>
      ) : (
        <div className={className}>{inner}</div>
      )}
      {item.onRemove && (
        <button
          type="button"
          onClick={item.onRemove}
          className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-ink-100 text-ink-400 shadow-soft ring-1 ring-ink-100 transition hover:text-rose-400"
          aria-label="Remove event"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function FullCalendar({
  items,
  kinds,
  initialView = "weekly",
}: {
  items: CalendarItem[];
  kinds: Record<string, CalendarKind>;
  initialView?: View;
}) {
  const [view, setView] = useState<View>(initialView);
  // Offset unit follows the view: days, weeks or months from today.
  const [offset, setOffset] = useState(0);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toISO(today);

  const visible = useMemo(() => items.filter((i) => !hidden.has(i.kind)), [items, hidden]);
  const byDate = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const i of visible) {
      if (!m.has(i.date)) m.set(i.date, []);
      m.get(i.date)!.push(i);
    }
    for (const list of m.values()) {
      list.sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
    }
    return m;
  }, [visible]);

  function toggleKind(k: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }
  function switchView(v: View) {
    setView(v);
    setOffset(0);
  }

  // ----- range + label per view -----
  let rangeLabel = "";
  let weekDates: Date[] = [];
  let monthAnchor = new Date(today);
  let dayDate = new Date(today);
  if (view === "weekly") {
    const start = addDays(weekStartOf(today), offset * 7);
    weekDates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    rangeLabel = `${weekDates[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  } else if (view === "monthly") {
    monthAnchor = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    rangeLabel = monthAnchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  } else {
    dayDate = addDays(today, offset);
    rangeLabel = dayDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }

  return (
    <div>
      {/* Toolbar: nav + view switch */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setOffset((o) => o - 1)} className="btn-ghost h-9 w-9 !px-0" aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setOffset(0)} className="btn-ghost h-9 px-3 text-xs font-semibold" aria-label="Jump to today">
            Today
          </button>
          <button onClick={() => setOffset((o) => o + 1)} className="btn-ghost h-9 w-9 !px-0" aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-ink-900">{rangeLabel}</span>
        </div>
        <div className="flex overflow-hidden rounded-xl border border-ink-200">
          {(["daily", "weekly", "monthly"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => switchView(v)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
                view === v ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-500 hover:text-ink-900",
              )}
            >
              {v === "daily" ? "Daily" : v === "weekly" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      {/* Event-type filter checkboxes */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {Object.entries(kinds).map(([k, s]) => (
          <label key={k} className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-600">
            <input
              type="checkbox"
              checked={!hidden.has(k)}
              onChange={() => toggleKind(k)}
              className="h-3.5 w-3.5 accent-brand-500"
            />
            <span className={cn("h-2.5 w-2.5 rounded-full", s.dot)} />
            {s.label}
          </label>
        ))}
      </div>

      {view === "monthly" && (
        <MonthGrid anchor={monthAnchor} byDate={byDate} kinds={kinds} todayISO={todayISO} />
      )}
      {view === "weekly" && (
        <WeekGrid weekDates={weekDates} byDate={byDate} kinds={kinds} todayISO={todayISO} />
      )}
      {view === "daily" && (
        <DayList date={dayDate} byDate={byDate} kinds={kinds} />
      )}
    </div>
  );
}

function MonthGrid({
  anchor, byDate, kinds, todayISO,
}: {
  anchor: Date; byDate: Map<string, CalendarItem[]>; kinds: Record<string, CalendarKind>; todayISO: string;
}) {
  const gridStart = weekStartOf(anchor);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const weeks = Math.ceil((Math.round((+monthEnd - +gridStart) / 86400000) + 1) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i));
  return (
    <div className="overflow-x-auto scroll-thin">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-7 border-b border-ink-100">
          {DAY_NAMES.map((d) => (
            <div key={d} className="px-2 pb-2 text-center text-xs font-medium text-ink-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d) => {
            const iso = toISO(d);
            const inMonth = d.getMonth() === anchor.getMonth();
            const dayItems = byDate.get(iso) ?? [];
            const shown = dayItems.slice(0, 3);
            return (
              <div
                key={iso}
                className={cn(
                  "min-h-[104px] border-b border-l border-ink-50 p-1.5 first:border-l-0 [&:nth-child(7n+1)]:border-l-0",
                  !inMonth && "bg-ink-50/40",
                  iso === todayISO && "bg-brand-50/40",
                )}
              >
                <div
                  className={cn(
                    "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    iso === todayISO ? "bg-brand-600 text-white" : inMonth ? "text-ink-900" : "text-ink-300",
                  )}
                >
                  {d.getDate()}
                </div>
                <div className="space-y-1">
                  {shown.map((i) => <Chip key={i.id} item={i} kinds={kinds} compact />)}
                  {dayItems.length > 3 && (
                    <div className="px-1 text-[10px] font-medium text-ink-400">+{dayItems.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekGrid({
  weekDates, byDate, kinds, todayISO,
}: {
  weekDates: Date[]; byDate: Map<string, CalendarItem[]>; kinds: Record<string, CalendarKind>; todayISO: string;
}) {
  const weekISO = weekDates.map(toISO);
  const hasAllDay = weekISO.some((iso) => (byDate.get(iso) ?? []).some((i) => !i.start));
  return (
    <>
      {/* Desktop grid */}
      <div className="hidden md:block">
        <div className="overflow-x-auto scroll-thin">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-ink-100">
              <div />
              {weekDates.map((d, i) => {
                const isToday = weekISO[i] === todayISO;
                return (
                  <div key={i} className={cn("px-2 pb-2 text-center", isToday && "rounded-t-lg bg-brand-500/15")}>
                    <div className="text-xs font-medium text-ink-500">{DAY_NAMES[i]}</div>
                    <div className={cn("mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold", isToday ? "bg-brand-600 text-white" : "text-ink-900")}>
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* All-day tasks row (form checks and other untimed items) */}
            {hasAllDay && (
              <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-ink-100 bg-ink-50/30">
                <div className="py-2 pr-2 text-right text-[10px] font-medium uppercase tracking-wide text-ink-400">Tasks</div>
                {weekISO.map((iso, i) => (
                  <div key={i} className={cn("space-y-1 border-l border-ink-50 p-1", iso === todayISO && "bg-brand-50/40")}>
                    {(byDate.get(iso) ?? []).filter((x) => !x.start).map((x) => <Chip key={x.id} item={x} kinds={kinds} compact />)}
                  </div>
                ))}
              </div>
            )}

            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-ink-50">
                <div className="py-3 pr-2 text-right text-[11px] font-medium text-ink-400">
                  {String(hour).padStart(2, "0")}:00
                </div>
                {weekISO.map((iso, i) => {
                  const cell = (byDate.get(iso) ?? []).filter((x) => hourOf(x.start) === hour);
                  return (
                    <div key={i} className={cn("min-h-[56px] space-y-1 border-l border-ink-50 p-1", iso === todayISO && "bg-brand-50/40")}>
                      {cell.map((x) => <Chip key={x.id} item={x} kinds={kinds} />)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile agenda */}
      <div className="space-y-5 md:hidden">
        {weekISO.every((iso) => (byDate.get(iso) ?? []).length === 0) && (
          <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-3 text-center text-xs text-ink-400">
            Nothing scheduled this week.
          </p>
        )}
        {weekISO.map((iso, i) => {
          const dayItems = byDate.get(iso) ?? [];
          if (dayItems.length === 0) return null;
          return (
            <div key={iso}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-semibold text-ink-900">{DAY_NAMES[i]}</span>
                <span className="text-xs text-ink-400">{weekDates[i].toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              </div>
              <div className="space-y-2">
                {dayItems.map((x) => <Chip key={x.id} item={x} kinds={kinds} />)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function DayList({
  date, byDate, kinds,
}: {
  date: Date; byDate: Map<string, CalendarItem[]>; kinds: Record<string, CalendarKind>;
}) {
  const iso = toISO(date);
  const dayItems = byDate.get(iso) ?? [];
  const allDay = dayItems.filter((x) => !x.start);
  return (
    <div>
      {dayItems.length === 0 && (
        <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-6 text-center text-xs text-ink-400">
          Nothing scheduled for this day.
        </p>
      )}
      {allDay.length > 0 && (
        <div className="mb-3 space-y-1.5 rounded-xl bg-ink-50/40 p-2">
          <div className="px-1 text-[10px] font-medium uppercase tracking-wide text-ink-400">Tasks</div>
          {allDay.map((x) => <Chip key={x.id} item={x} kinds={kinds} />)}
        </div>
      )}
      {dayItems.length > 0 && HOURS.map((hour) => {
        const cell = dayItems.filter((x) => hourOf(x.start) === hour);
        return (
          <div key={hour} className="grid grid-cols-[56px_1fr] border-b border-ink-50">
            <div className="py-3 pr-2 text-right text-[11px] font-medium text-ink-400">
              {String(hour).padStart(2, "0")}:00
            </div>
            <div className="min-h-[48px] space-y-1 border-l border-ink-50 p-1">
              {cell.map((x) => <Chip key={x.id} item={x} kinds={kinds} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
