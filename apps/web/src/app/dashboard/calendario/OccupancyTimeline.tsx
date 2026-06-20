"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { formatDate } from "@/lib/date";
import { getRoomTypeLabel } from "@/lib/room";

interface TimelineRoom {
  id: number;
  number: string;
  type: string;
}

interface TimelineReservation {
  id: number;
  guest: { fullName: string };
  checkIn: string;
  checkOut: string;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  roomId: number;
}

const WINDOW_DAYS = 14;
const STEP_DAYS = 7;

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const STATUS_STYLES: Record<
  "PENDING" | "ACTIVE" | "COMPLETED",
  { bar: string; dot: string; label: string }
> = {
  PENDING: {
    bar: "bg-status-cleaning-bg text-status-cleaning-text border border-status-cleaning-border",
    dot: "bg-status-cleaning-text",
    label: "Pendiente",
  },
  ACTIVE: {
    bar: "bg-status-occupied-bg text-status-occupied-text border border-status-occupied-border",
    dot: "bg-status-occupied-text",
    label: "Activa",
  },
  COMPLETED: {
    bar: "bg-status-available-bg text-status-available-text border border-status-available-border",
    dot: "bg-status-available-text",
    label: "Finalizada",
  },
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function parseDateOnly(iso: string) {
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatRange(start: Date, end: Date) {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export default function OccupancyTimeline({
  rooms,
  reservations,
}: {
  rooms: TimelineRoom[];
  reservations: TimelineReservation[];
}) {
  const today = startOfDay(new Date());
  const [windowStart, setWindowStart] = useState(today);

  const windowEnd = addDays(windowStart, WINDOW_DAYS);
  const days = useMemo(
    () => Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(windowStart, i)),
    [windowStart],
  );

  const barsByRoom = useMemo(() => {
    const map = new Map<number, ReturnType<typeof buildBar>[]>();
    for (const room of rooms) map.set(room.id, []);

    for (const r of reservations) {
      if (r.status === "CANCELLED") continue;
      if (!map.has(r.roomId)) continue;

      const start = parseDateOnly(r.checkIn);
      const end = parseDateOnly(r.checkOut);
      const clampStart = start < windowStart ? windowStart : start;
      const clampEnd = end > windowEnd ? windowEnd : end;
      if (clampEnd <= windowStart || clampStart >= windowEnd) continue;

      const span = diffDays(clampStart, clampEnd);
      if (span <= 0) continue;

      map.get(r.roomId)!.push(
        buildBar(r, {
          left: (diffDays(windowStart, clampStart) / WINDOW_DAYS) * 100,
          width: (span / WINDOW_DAYS) * 100,
          clippedStart: start < windowStart,
          clippedEnd: end > windowEnd,
          start,
          end,
        }),
      );
    }
    return map;
  }, [rooms, reservations, windowStart, windowEnd]);

  return (
    <div className="w-full flex flex-col gap-4 bg-card rounded-2xl border border-border/50 shadow-sm p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWindowStart((s) => addDays(s, -STEP_DAYS))}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWindowStart((s) => addDays(s, STEP_DAYS))}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWindowStart(today)}
            className="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-border/50 bg-background text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
          >
            <CalendarDays className="w-4 h-4" /> Hoy
          </button>
          <span className="text-sm font-semibold text-foreground ml-1">
            {formatRange(windowStart, addDays(windowEnd, -1))}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-xl border border-border/50">
          {(["PENDING", "ACTIVE", "COMPLETED"] as const).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${STATUS_STYLES[s].dot}`} />
              <span className="font-medium">{STATUS_STYLES[s].label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          <div className="flex border-b border-border/50">
            <div className="w-44 shrink-0 px-4 py-2 text-xs font-semibold text-muted-foreground">
              Habitación
            </div>
            <div className="flex-1 flex">
              {days.map((d) => {
                const isToday = isSameDay(d, today);
                return (
                  <div
                    key={d.toISOString()}
                    className={`flex-1 text-center py-2 border-l border-border/40 ${
                      isToday ? "bg-primary/10" : ""
                    }`}
                  >
                    <div
                      className={`text-sm font-semibold ${
                        isToday ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {d.getDate()}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {WEEKDAYS[d.getDay()]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {rooms.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              No hay habitaciones registradas.
            </div>
          ) : (
            rooms.map((room) => {
              const bars = barsByRoom.get(room.id) ?? [];
              return (
                <div
                  key={room.id}
                  className="flex border-b border-border/40 last:border-b-0 hover:bg-muted/20 transition-colors"
                >
                  <div className="w-44 shrink-0 px-4 py-3 flex flex-col justify-center">
                    <span className="font-bold text-foreground text-sm">
                      Cto. {room.number}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getRoomTypeLabel(room.type)}
                    </span>
                  </div>

                  <div className="flex-1 relative min-h-[3.25rem]">
                    <div className="absolute inset-0 flex pointer-events-none">
                      {days.map((d) => (
                        <div
                          key={d.toISOString()}
                          className={`flex-1 border-l border-border/30 ${
                            isSameDay(d, today) ? "bg-primary/5" : ""
                          }`}
                        />
                      ))}
                    </div>

                    {bars.map((bar) => {
                      const style = STATUS_STYLES[bar.status];
                      return (
                        <div
                          key={bar.id}
                          title={`${bar.guestName} · ${bar.rangeLabel}`}
                          style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                          className={`absolute top-1/2 -translate-y-1/2 h-7 flex items-center px-2 rounded-md text-xs font-semibold overflow-hidden ${style.bar} ${
                            bar.clippedStart ? "rounded-l-none" : ""
                          } ${bar.clippedEnd ? "rounded-r-none" : ""}`}
                        >
                          <span className="truncate">{bar.guestName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function buildBar(
  r: TimelineReservation,
  pos: {
    left: number;
    width: number;
    clippedStart: boolean;
    clippedEnd: boolean;
    start: Date;
    end: Date;
  },
) {
  return {
    id: r.id,
    guestName: r.guest.fullName,
    status: r.status as "PENDING" | "ACTIVE" | "COMPLETED",
    left: pos.left,
    width: pos.width,
    clippedStart: pos.clippedStart,
    clippedEnd: pos.clippedEnd,
    rangeLabel: `${formatDate(pos.start)} → ${formatDate(pos.end)}`,
  };
}
