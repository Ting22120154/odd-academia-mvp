"use client";

import { useEffect, useRef, useState } from "react";

export type DateRange = { from: Date; to: Date };

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(day: Date, from: Date, to: Date): boolean {
  const t = day.getTime();
  return t >= from.getTime() && t <= to.getTime();
}

export function formatDateRange(from: Date, to: Date): string {
  const fmt = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}.${mm}.${d.getFullYear()}`;
  };
  return `${fmt(from)}–${fmt(to)}`;
}

export function lastNDaysRange(days: number): DateRange {
  const to = endOfDay(new Date());
  const from = startOfDay(new Date());
  from.setDate(from.getDate() - (days - 1));
  return { from, to };
}

type MonthGridProps = {
  year: number;
  month: number;
  rangeFrom: Date;
  rangeTo: Date | null;
  onDayClick: (day: Date) => void;
};

function MonthGrid({ year, month, rangeFrom, rangeTo, onDayClick }: MonthGridProps) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const from = rangeFrom ? startOfDay(rangeFrom) : null;
  const to = rangeTo ? startOfDay(rangeTo) : null;
  const lo = from && to ? (from <= to ? from : to) : from;
  const hi = from && to ? (from <= to ? to : from) : null;

  return (
    <div className="w-64">
      <div className="mb-2 text-center text-sm font-semibold text-gray-800">
        {MONTHS[month]} {year}
      </div>
      <div className="mb-1 grid grid-cols-7">
        {DAYS.map((d) => (
          <div key={d} className="py-1 text-center text-[10px] font-medium text-gray-400">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={i} className="h-8" />;
          }
          const date = startOfDay(new Date(year, month, day));
          const isStart = lo ? isSameDay(date, lo) : false;
          const isEnd = hi ? isSameDay(date, hi) : false;
          const inRange = lo && hi ? isInRange(date, lo, hi) : isStart;
          const isEndpoint = isStart || isEnd;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick(date)}
              className={[
                "h-8 text-xs transition-colors",
                inRange ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100",
                isStart ? "rounded-l-full" : "",
                isEnd ? "rounded-r-full" : "",
                isEndpoint ? "!bg-[#0066ff] !text-white font-semibold" : "",
                !hi && isStart ? "rounded-full" : "",
              ].join(" ")}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type DateRangePickerProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
};

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(value.from.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.from.getMonth());
  const [draftFrom, setDraftFrom] = useState<Date | null>(null);
  const [draftTo, setDraftTo] = useState<Date | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setDraftFrom(null);
      setDraftTo(null);
    }
  }, [open]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const displayFrom = draftFrom ?? value.from;
  const displayTo = draftTo ?? (draftFrom ? null : value.to);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const secondMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const secondYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  function handleDayClick(day: Date) {
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(day);
      setDraftTo(null);
      return;
    }
    let from = draftFrom;
    let to = day;
    if (to < from) [from, to] = [to, from];
    setDraftFrom(from);
    setDraftTo(to);
    onChange({ from: startOfDay(from), to: endOfDay(to) });
    setOpen(false);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {formatDateRange(displayFrom, displayTo ?? displayFrom)}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded p-1 text-sm text-gray-500 hover:bg-gray-100"
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="text-xs text-gray-500">
              {draftFrom && !draftTo ? "Select end date" : "Select start date"}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded p-1 text-sm text-gray-500 hover:bg-gray-100"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <MonthGrid
              year={viewYear}
              month={viewMonth}
              rangeFrom={displayFrom}
              rangeTo={displayTo}
              onDayClick={handleDayClick}
            />
            <MonthGrid
              year={secondYear}
              month={secondMonth}
              rangeFrom={displayFrom}
              rangeTo={displayTo}
              onDayClick={handleDayClick}
            />
          </div>
        </div>
      )}
    </div>
  );
}
