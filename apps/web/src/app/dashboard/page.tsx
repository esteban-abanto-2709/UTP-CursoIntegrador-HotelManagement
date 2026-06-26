"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { getRoomTypeLabel } from "@/lib/room";
import { toast } from "sonner";
import {
  TrendingUp,
  CalendarDays,
  Coins,
  DoorOpen,
  Loader2,
  LogIn,
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip } from "recharts";
import {
  ACCENT,
  AXIS,
  BRICOLAGE,
  MONTH_LABELS,
  tooltipStyle,
  formatPEN,
  getApiErrorMessage,
  ChartFrame,
} from "@/lib/analytics-ui";

type RoomStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";

interface Room {
  id: number;
  number: string;
  type: string;
  status: RoomStatus;
}

interface Reservation {
  id: number;
  guest: { fullName: string };
  checkIn: string;
  checkOut: string;
  room: { number: string; type: string };
}

interface AuditLogRow {
  id: number;
  tableName: string;
  recordId: number;
  performedAt: string;
  employee: { username: string; firstName: string | null; lastName: string | null };
  action: { name: string };
}

const STATUS_META: Record<
  RoomStatus,
  { label: string; color: string }
> = {
  AVAILABLE: { label: "Disponibles", color: "var(--color-status-available-dot)" },
  OCCUPIED: { label: "Ocupadas", color: "var(--color-status-occupied-dot)" },
  CLEANING: { label: "Limpieza", color: "var(--color-status-cleaning-dot)" },
  MAINTENANCE: {
    label: "Mantenimiento",
    color: "var(--color-status-maintenance-dot)",
  },
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "creó un registro",
  UPDATE: "actualizó",
  DELETE: "eliminó",
  CHECKIN: "registró un check-in",
  CHECKOUT: "registró un check-out",
  CANCEL: "canceló",
};

const ENTITY_LABELS: Record<string, string> = {
  Reservation: "una reserva",
  Employee: "personal",
  Room: "una habitación",
};

const ACTION_COLOR: Record<string, string> = {
  CREATE: "var(--color-status-available-dot)",
  UPDATE: "var(--color-status-cleaning-dot)",
  CHECKIN: "var(--color-status-occupied-dot)",
  CHECKOUT: "var(--color-status-occupied-dot)",
  DELETE: "var(--destructive)",
  CANCEL: "var(--destructive)",
};

function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function datePart(iso: string) {
  return iso.split("T")[0];
}

function nightsBetween(checkIn: string, checkOut: string) {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [monthPayments, setMonthPayments] = useState(0);
  const [occupancy, setOccupancy] = useState<{ month: number; reservations: number }[]>([]);
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [arrivals, setArrivals] = useState<Reservation[]>([]);
  const [departuresToday, setDeparturesToday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = todayISO();
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const load = async () => {
      const results = await Promise.allSettled([
        api.get(routes.api.rooms.list()),
        api.get(routes.api.analytics.monthlyRevenue(year)),
        api.get(routes.api.analytics.occupancy(year)),
        api.get(routes.api.auditLogs.list({ take: 6 })),
        api.get(routes.api.reservations.list({ status: "PENDING", sort: "checkin_asc", take: 100 })),
        api.get(routes.api.reservations.list({ status: "ACTIVE", sort: "checkout_asc", take: 100 })),
      ]);

      const [roomsRes, revenueRes, occRes, logsRes, pendingRes, activeRes] = results;

      if (roomsRes.status === "fulfilled") {
        setRooms(roomsRes.value.data.data);
      } else {
        toast.error(getApiErrorMessage(roomsRes.reason, "Error al cargar habitaciones"));
      }

      if (revenueRes.status === "fulfilled") {
        const m = revenueRes.value.data.months?.[month - 1];
        setMonthRevenue(m?.grossRevenue ?? 0);
        setMonthPayments(m?.paymentsCount ?? 0);
      }

      if (occRes.status === "fulfilled") {
        setOccupancy(occRes.value.data.months ?? []);
      }

      if (logsRes.status === "fulfilled") {
        setLogs(logsRes.value.data.data);
      }

      if (pendingRes.status === "fulfilled") {
        const pending: Reservation[] = pendingRes.value.data.data;
        setArrivals(pending.filter((r) => datePart(r.checkIn) === today));
      }

      if (activeRes.status === "fulfilled") {
        const active: Reservation[] = activeRes.value.data.data;
        setDeparturesToday(
          active.filter((r) => datePart(r.checkOut) === today).length,
        );
      }

      setLoading(false);
    };

    load();
  }, []);

  const total = rooms.length;
  const counts: Record<RoomStatus, number> = {
    AVAILABLE: 0,
    OCCUPIED: 0,
    CLEANING: 0,
    MAINTENANCE: 0,
  };
  rooms.forEach((r) => (counts[r.status] += 1));

  const occPct = total ? Math.round((counts.OCCUPIED / total) * 100) : 0;
  const arrivalsToday = arrivals.length;
  const reservationsToday = arrivalsToday + departuresToday;

  const occChartData = occupancy.map((m) => ({
    name: MONTH_LABELS[m.month - 1],
    reservas: m.reservations,
  }));

  const donutData = (Object.keys(STATUS_META) as RoomStatus[])
    .map((s) => ({ name: STATUS_META[s].label, value: counts[s], color: STATUS_META[s].color }))
    .filter((d) => d.value > 0);

  return (
    <div className="flex flex-col gap-5 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI ROW */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Ocupación"
          icon={<TrendingUp className="h-4 w-4" />}
          iconBg="bg-status-available-icon-bg"
          iconText="text-status-available-icon-text"
          loading={loading}
          value={
            <>
              {occPct}
              <span className="text-xl text-muted-soft">%</span>
            </>
          }
          hint={`${counts.OCCUPIED} de ${total} habitaciones ocupadas`}
        />
        <KpiCard
          label="Reservas de hoy"
          icon={<CalendarDays className="h-4 w-4" />}
          iconBg="bg-status-occupied-icon-bg"
          iconText="text-status-occupied-icon-text"
          loading={loading}
          value={reservationsToday}
          hint={
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-status-occupied-icon-text" />
                {arrivalsToday} llegadas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-soft" />
                {departuresToday} salidas
              </span>
            </span>
          }
        />
        <KpiCard
          label="Ingresos del mes"
          icon={<Coins className="h-4 w-4" />}
          iconBg="bg-status-cleaning-icon-bg"
          iconText="text-status-cleaning-icon-text"
          loading={loading}
          value={formatPEN(monthRevenue)}
          hint={`Mes en curso · ${monthPayments} pagos`}
        />
        <KpiCard
          label="Disponibles"
          icon={<DoorOpen className="h-4 w-4" />}
          iconBg="bg-primary/10"
          iconText="text-primary"
          loading={loading}
          value={
            <>
              {counts.AVAILABLE}
              <span className="text-xl text-muted-soft"> / {total}</span>
            </>
          }
          hint="Libres para esta noche"
        />
      </div>

      {/* CHARTS ROW */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1.7fr_1fr]">
        {/* Ocupación mensual */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <div className="mb-2">
            <h3 className="font-heading text-base font-bold text-foreground" style={{ fontFamily: BRICOLAGE }}>
              Ocupación mensual
            </h3>
            <p className="text-xs text-muted-soft mt-0.5">
              Reservas que ocupan habitaciones cada mes · {new Date().getFullYear()}
            </p>
          </div>
          <ChartFrame
            loading={loading}
            empty={occChartData.every((m) => m.reservas === 0)}
            emptyLabel="Aún no hay reservas registradas."
          >
            <BarChart data={occChartData}>
              <XAxis dataKey="name" stroke={AXIS} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value) => [String(value), "Reservas"]}
                cursor={{ fill: "color-mix(in srgb, var(--primary) 8%, transparent)" }}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="reservas" fill={ACCENT} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </div>

        {/* Estado de habitaciones (donut) */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h3 className="font-heading text-base font-bold text-foreground" style={{ fontFamily: BRICOLAGE }}>
            Estado de habitaciones
          </h3>
          <p className="text-xs text-muted-soft mt-0.5 mb-3">
            {total} habitaciones en total
          </p>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative h-32 w-32 flex-none">
                <PieChart width={128} height={128}>
                  <Pie
                    data={donutData.length ? donutData : [{ name: "—", value: 1, color: "var(--border)" }]}
                    dataKey="value"
                    innerRadius={42}
                    outerRadius={62}
                    paddingAngle={donutData.length > 1 ? 2 : 0}
                    stroke="none"
                  >
                    {(donutData.length ? donutData : [{ color: "var(--border)" }]).map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading text-2xl font-bold text-foreground leading-none">
                    {total}
                  </span>
                  <span className="text-[10px] text-muted-soft">hab.</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-2.5">
                {(Object.keys(STATUS_META) as RoomStatus[]).map((s) => (
                  <div key={s} className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-sm flex-none"
                      style={{ background: STATUS_META[s].color }}
                    />
                    <span className="text-[13px] text-muted-foreground flex-1">
                      {STATUS_META[s].label}
                    </span>
                    <span className="text-[13px] font-bold text-foreground font-heading">
                      {counts[s]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVITY ROW */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1.7fr_1fr]">
        {/* Actividad reciente */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h3 className="font-heading text-base font-bold text-foreground mb-1" style={{ fontFamily: BRICOLAGE }}>
            Actividad reciente
          </h3>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-soft py-8 text-center">Sin actividad reciente.</p>
          ) : (
            <div className="flex flex-col">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 py-3 border-b border-border-soft last:border-0"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-none"
                    style={{ background: ACTION_COLOR[log.action.name] ?? "var(--muted-soft)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] text-foreground truncate">
                      <span className="font-semibold">{employeeName(log.employee)}</span>{" "}
                      {ACTION_LABELS[log.action.name] ?? log.action.name}{" "}
                      {ENTITY_LABELS[log.tableName] ?? log.tableName}
                    </p>
                    <p className="text-xs text-muted-soft">#{log.recordId}</p>
                  </div>
                  <span className="text-xs text-muted-soft whitespace-nowrap">
                    {timeAgo(log.performedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Llegadas de hoy */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h3 className="font-heading text-base font-bold text-foreground mb-3" style={{ fontFamily: BRICOLAGE }}>
            Llegadas de hoy
          </h3>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : arrivals.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <LogIn className="h-7 w-7 text-muted-soft" />
              <p className="text-sm text-muted-soft">Sin llegadas para hoy.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {arrivals.map((r) => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="h-9 w-9 flex-none rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {initials(r.guest.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-foreground truncate">
                      {r.guest.fullName}
                    </p>
                    <p className="text-xs text-muted-soft">
                      Hab. {r.room.number} · {getRoomTypeLabel(r.room.type)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground font-heading whitespace-nowrap">
                    {nightsBetween(r.checkIn, r.checkOut)} noches
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function employeeName(e: AuditLogRow["employee"]) {
  return [e.firstName, e.lastName].filter(Boolean).join(" ") || e.username;
}

function KpiCard({
  label,
  icon,
  iconBg,
  iconText,
  value,
  hint,
  loading,
}: {
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  iconText: string;
  value: React.ReactNode;
  hint: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconBg} ${iconText}`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <Loader2 className="h-7 w-7 animate-spin text-primary mt-3" />
      ) : (
        <div className="font-heading text-3xl font-bold text-foreground mt-2.5 leading-none">
          {value}
        </div>
      )}
      <div className="text-xs text-muted-soft mt-2.5">{hint}</div>
    </div>
  );
}
