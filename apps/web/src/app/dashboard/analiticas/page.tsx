"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  Loader2,
  BarChart3,
  BedDouble,
  Users,
  CalendarRange,
  ScrollText,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  ACCENT,
  GRID,
  AXIS,
  BRICOLAGE,
  MONTH_LABELS,
  tooltipStyle,
  formatPEN,
  getApiErrorMessage,
  ChartFrame,
} from "@/lib/analytics-ui";

const LOGS_PAGE_SIZE = 20;

// ---------- Métricas operativas ----------

interface TopRoom {
  number: string;
  type: string | null;
  reservations: number;
  nights: number;
}

interface EmployeeRankingItem {
  employeeId: number;
  firstName: string | null;
  lastName: string | null;
  charges: number;
  chargesTotal: number;
}

interface OccupancyPoint {
  month: number;
  reservations: number;
}

interface OccupancyResponse {
  year: number;
  months: OccupancyPoint[];
}

// ---------- Auditoría ----------

type ActionName =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "CHECKIN"
  | "CHECKOUT"
  | "CANCEL";

interface AuditEmployee {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
}

interface AuditLogRow {
  id: number;
  tableName: string;
  recordId: number;
  performedAt: string;
  previousValue: unknown;
  newValue: unknown;
  employee: AuditEmployee;
  action: { name: string };
}

interface EmployeeOption {
  id: number;
  nombres: string | null;
  apellidoPaterno: string | null;
}

const ENTITY_OPTIONS: { value: string; label: string }[] = [
  { value: "Reservation", label: "Reservas" },
  { value: "Employee", label: "Personal" },
  { value: "Room", label: "Habitaciones" },
];

const ENTITY_LABELS: Record<string, string> = {
  Reservation: "Reserva",
  Employee: "Empleado",
  Room: "Habitación",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Creación",
  UPDATE: "Edición",
  DELETE: "Eliminación",
  CHECKIN: "Check-in",
  CHECKOUT: "Check-out",
  CANCEL: "Cancelación",
};

const ACTION_STYLES: Record<string, string> = {
  CREATE:
    "bg-status-available-bg text-status-available-text border-status-available-border",
  UPDATE:
    "bg-status-cleaning-bg text-status-cleaning-text border-status-cleaning-border",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
  CHECKIN:
    "bg-status-occupied-bg text-status-occupied-text border-status-occupied-border",
  CHECKOUT:
    "bg-status-occupied-bg text-status-occupied-text border-status-occupied-border",
  CANCEL: "bg-destructive/10 text-destructive border-destructive/20",
};

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function employeeName(employee: AuditEmployee) {
  const name = [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ");
  return name || employee.username;
}

function getActionBadge(action: string) {
  const style =
    ACTION_STYLES[action] ?? "bg-accent text-muted-foreground border-border";
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full font-semibold border ${style}`}
    >
      {ACTION_LABELS[action] ?? action}
    </span>
  );
}

function formatJsonValue(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export default function AnaliticasPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [topRooms, setTopRooms] = useState<TopRoom[]>([]);
  const [employeeRanking, setEmployeeRanking] = useState<EmployeeRankingItem[]>(
    [],
  );
  const [occupancy, setOccupancy] = useState<OccupancyResponse | null>(null);
  const [isLoadingTopRooms, setIsLoadingTopRooms] = useState(true);
  const [isLoadingRanking, setIsLoadingRanking] = useState(true);
  const [isLoadingOccupancy, setIsLoadingOccupancy] = useState(true);

  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [logsCursorStack, setLogsCursorStack] = useState<(number | null)[]>([
    null,
  ]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsNextCursor, setLogsNextCursor] = useState<number | null>(null);
  const [logsHasNext, setLogsHasNext] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [detail, setDetail] = useState<AuditLogRow | null>(null);

  const [tableName, setTableName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Guard de rol (coherente con TD-008): los no-OWNER no deberían ver esta página.
  useEffect(() => {
    if (user && user.role !== "OWNER") {
      router.replace(routes.dashboard.home());
    }
  }, [user, router]);

  const fetchTopRooms = useCallback(async () => {
    setIsLoadingTopRooms(true);
    try {
      const res = await api.get(routes.api.analytics.topRooms());
      setTopRooms(res.data);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Error al cargar las habitaciones más usadas",
        ),
      );
    } finally {
      setIsLoadingTopRooms(false);
    }
  }, []);

  const fetchEmployeeRanking = useCallback(async () => {
    setIsLoadingRanking(true);
    try {
      const res = await api.get(routes.api.analytics.employeeRanking());
      setEmployeeRanking(res.data);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Error al cargar el ranking de empleados"),
      );
    } finally {
      setIsLoadingRanking(false);
    }
  }, []);

  const fetchOccupancy = useCallback(async (year: number) => {
    setIsLoadingOccupancy(true);
    try {
      const res = await api.get(routes.api.analytics.occupancy(year));
      setOccupancy(res.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Error al cargar la ocupación"));
    } finally {
      setIsLoadingOccupancy(false);
    }
  }, []);

  const logsCursor = logsCursorStack[logsCursorStack.length - 1];

  const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const res = await api.get(
        routes.api.auditLogs.list({
          tableName: tableName || undefined,
          employeeId: employeeId ? Number(employeeId) : undefined,
          from: from || undefined,
          to: to || undefined,
          cursor: logsCursor ?? undefined,
          take: LOGS_PAGE_SIZE,
        }),
      );
      setLogs(res.data.data);
      setLogsTotal(res.data.total);
      setLogsNextCursor(res.data.nextCursor);
      setLogsHasNext(res.data.hasNext);
    } catch {
      toast.error("Error al cargar el registro de auditoría");
    } finally {
      setIsLoadingLogs(false);
    }
  }, [tableName, employeeId, from, to, logsCursor]);

  useEffect(() => {
    fetchTopRooms();
  }, [fetchTopRooms]);

  useEffect(() => {
    fetchEmployeeRanking();
  }, [fetchEmployeeRanking]);

  useEffect(() => {
    fetchOccupancy(selectedYear);
  }, [fetchOccupancy, selectedYear]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setLogsCursorStack([null]);
  }, [tableName, employeeId, from, to]);

  const handleLogsNextPage = () => {
    if (logsHasNext && logsNextCursor != null) {
      setLogsCursorStack((s) => [...s, logsNextCursor]);
    }
  };

  const handleLogsPrevPage = () => {
    setLogsCursorStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  };

  useEffect(() => {
    api
      .get(routes.api.employees.list())
      .then((res) => setEmployees(res.data.data))
      .catch(() => toast.error("Error al cargar la lista de empleados"));
  }, []);

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [current, current - 1, current - 2, current - 3];
  }, []);

  const topRoomsChartData = useMemo(
    () =>
      topRooms.map((room) => ({
        name: `Hab. ${room.number}`,
        reservas: room.reservations,
        noches: room.nights,
      })),
    [topRooms],
  );

  const rankingChartData = useMemo(
    () =>
      employeeRanking.map((emp) => ({
        name:
          [emp.firstName, emp.lastName].filter(Boolean).join(" ") ||
          `Empleado #${emp.employeeId}`,
        monto: emp.chargesTotal,
        cargos: emp.charges,
      })),
    [employeeRanking],
  );

  const occupancyChartData = useMemo(
    () =>
      (occupancy?.months ?? []).map((month) => ({
        name: MONTH_LABELS[month.month - 1],
        reservas: month.reservations,
      })),
    [occupancy],
  );

  if (user && user.role !== "OWNER") {
    return null;
  }

  const selectClass =
    "h-11 px-3 rounded-xl border border-border bg-card text-foreground outline-none transition-all cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/20";

  const hasFilters = tableName || employeeId || from || to;

  return (
    <div className="-m-6 min-h-full bg-background p-6 md:-m-8 md:p-8">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Cabecera */}
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2"
              style={{ fontFamily: BRICOLAGE }}
            >
              <BarChart3 className="h-8 w-8 text-primary" />
              Analíticas
            </h2>
            <p className="text-muted-foreground mt-2 text-base">
              Ocupación, habitaciones más usadas, desempeño del personal y el
              registro de actividad del sistema.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={selectClass}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ocupación mensual */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h3
            className="text-lg font-semibold text-foreground flex items-center gap-2"
            style={{ fontFamily: BRICOLAGE }}
          >
            <CalendarRange className="h-5 w-5 text-primary" />
            Ocupación mensual · {selectedYear}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Reservas que ocupan habitaciones en cada mes (excluye canceladas).
          </p>
          <ChartFrame
            loading={isLoadingOccupancy}
            empty={occupancyChartData.every((m) => m.reservas === 0)}
            emptyLabel="Aún no hay reservas registradas."
          >
            <BarChart data={occupancyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="name" stroke={AXIS} fontSize={12} />
              <YAxis
                stroke={AXIS}
                fontSize={12}
                width={40}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value) => [String(value), "Reservas"]}
                cursor={{
                  fill: "color-mix(in srgb, var(--primary) 8%, transparent)",
                }}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="reservas" fill={ACCENT} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </div>

        {/* Top habitaciones */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h3
            className="text-lg font-semibold text-foreground flex items-center gap-2"
            style={{ fontFamily: BRICOLAGE }}
          >
            <BedDouble className="h-5 w-5 text-primary" />
            Habitaciones más usadas
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Top 10 por número de reservas (excluye canceladas).
          </p>
          <ChartFrame
            loading={isLoadingTopRooms}
            empty={topRoomsChartData.length === 0}
            emptyLabel="Aún no hay reservas registradas."
          >
            <BarChart data={topRoomsChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="name" stroke={AXIS} fontSize={12} />
              <YAxis
                stroke={AXIS}
                fontSize={12}
                width={40}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value, name) => [
                  String(value),
                  name === "noches" ? "Noches" : "Reservas",
                ]}
                cursor={{
                  fill: "color-mix(in srgb, var(--primary) 8%, transparent)",
                }}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="reservas" fill={ACCENT} radius={[6, 6, 0, 0]} />
              <Bar dataKey="noches" fill={AXIS} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </div>

        {/* Ranking de empleados */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h3
            className="text-lg font-semibold text-foreground flex items-center gap-2"
            style={{ fontFamily: BRICOLAGE }}
          >
            <Users className="h-5 w-5 text-primary" />
            Empleados destacados
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Top 10 por monto de consumos registrados a huéspedes. Mide consumos
            registrados, no cobros procesados.
          </p>
          <ChartFrame
            loading={isLoadingRanking}
            empty={rankingChartData.length === 0}
            emptyLabel="Aún no hay consumos registrados."
          >
            <BarChart
              data={rankingChartData}
              layout="vertical"
              margin={{ left: 24 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis
                type="number"
                stroke={AXIS}
                fontSize={12}
                tickFormatter={(value: number) => formatPEN(value)}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke={AXIS}
                fontSize={12}
                width={140}
              />
              <Tooltip
                formatter={(value) => [formatPEN(Number(value)), "Consumos"]}
                cursor={{
                  fill: "color-mix(in srgb, var(--primary) 8%, transparent)",
                }}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="monto" fill={ACCENT} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ChartFrame>
        </div>

        {/* Registro de auditoría */}
        <div className="border-t border-border pt-6 mt-2">
          <h3
            className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2"
            style={{ fontFamily: BRICOLAGE }}
          >
            <ScrollText className="h-6 w-6 text-primary" />
            Registro de actividad
          </h3>
          <p className="text-muted-foreground mt-1 text-base">
            Consulta quién realizó cada acción sobre reservas, personal y
            habitaciones, y cuándo.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-muted-foreground">
                Entidad
              </label>
              <select
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className={selectClass}
              >
                <option value="">Todas</option>
                {ENTITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-muted-foreground">
                Empleado
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className={selectClass}
              >
                <option value="">Todos</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {[emp.nombres, emp.apellidoPaterno]
                      .filter(Boolean)
                      .join(" ") || `Empleado #${emp.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-muted-foreground">
                Desde
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={selectClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-muted-foreground">
                Hasta
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={selectClass}
              />
            </div>

            {hasFilters && (
              <button
                onClick={() => {
                  setTableName("");
                  setEmployeeId("");
                  setFrom("");
                  setTo("");
                }}
                className="h-11 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground transition-all hover:bg-background hover:text-foreground"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-8">
          <Table>
            <TableHeader>
              <TableRow className="bg-background hover:bg-background border-border">
                <TableHead className="font-semibold text-muted-foreground py-4 pl-6">
                  Fecha y hora
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground">
                  Empleado
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground">
                  Acción
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground">
                  Entidad
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground text-right pr-6">
                  ID del registro
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingLogs ? (
                <TableRow className="border-border">
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span>Cargando registros...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ScrollText className="h-6 w-6 text-muted-soft" />
                      <span>
                        No hay registros que coincidan con los filtros.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    onClick={() => setDetail(log)}
                    className="border-border transition-colors hover:bg-background group cursor-pointer"
                  >
                    <TableCell className="text-muted-foreground pl-6">
                      {formatDateTime(log.performedAt)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {employeeName(log.employee)}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action.name)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {ENTITY_LABELS[log.tableName] ?? log.tableName}
                    </TableCell>
                    <TableCell className="text-right pr-6 text-muted-foreground">
                      #{log.recordId}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!isLoadingLogs && logsTotal > 0 && (
            <div className="px-6 py-4 border-t border-border">
              <PaginationControls
                total={logsTotal}
                hasPrev={logsCursorStack.length > 1}
                hasNext={logsHasNext}
                onPrev={handleLogsPrevPage}
                onNext={handleLogsNextPage}
                disabled={isLoadingLogs}
              />
            </div>
          )}
        </div>
      </div>

      {/* Diálogo de detalle */}
      <Dialog
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="sm:max-w-[620px] rounded-2xl bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">
              Detalle del registro
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {detail
                ? `${ACTION_LABELS[detail.action.name as ActionName] ?? detail.action.name} sobre ${ENTITY_LABELS[detail.tableName] ?? detail.tableName} #${detail.recordId}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {detail && (
            <div className="flex flex-col gap-4 mt-2">
              {/* Metadatos */}
              <div className="bg-background rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    Empleado
                  </span>
                  <span className="font-semibold text-foreground">
                    {employeeName(detail.employee)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    Fecha y hora
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatDateTime(detail.performedAt)}
                  </span>
                </div>
              </div>

              {/* Antes / Después */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Antes
                  </span>
                  {formatJsonValue(detail.previousValue) ? (
                    <pre className="text-xs bg-background border border-border rounded-xl p-3 overflow-auto max-h-[280px] whitespace-pre-wrap break-words text-foreground">
                      {formatJsonValue(detail.previousValue)}
                    </pre>
                  ) : (
                    <p className="text-xs text-muted-foreground bg-background border border-border rounded-xl p-3">
                      Sin datos previos.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Después
                  </span>
                  {formatJsonValue(detail.newValue) ? (
                    <pre className="text-xs bg-background border border-border rounded-xl p-3 overflow-auto max-h-[280px] whitespace-pre-wrap break-words text-foreground">
                      {formatJsonValue(detail.newValue)}
                    </pre>
                  ) : (
                    <p className="text-xs text-muted-foreground bg-background border border-border rounded-xl p-3">
                      Sin datos nuevos.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
