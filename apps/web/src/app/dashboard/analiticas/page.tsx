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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
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
  CREATE: "bg-[#E7F0E8] text-[#2F6B3F] border-[#CBE2CE]",
  UPDATE: "bg-[#FBF1DD] text-[#9A6B1E] border-[#EFD9A8]",
  DELETE: "bg-[#F6E2DC] text-[#A8442F] border-[#E8C5B8]",
  CHECKIN: "bg-[#E2ECF2] text-[#3C6B8A] border-[#C4D8E4]",
  CHECKOUT: "bg-[#E2ECF2] text-[#3C6B8A] border-[#C4D8E4]",
  CANCEL: "bg-[#F6E2DC] text-[#A8442F] border-[#E8C5B8]",
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
    ACTION_STYLES[action] ?? "bg-[#EEE9DC] text-[#6E7567] border-[#E6E0D1]";
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
  const [employeeRanking, setEmployeeRanking] = useState<EmployeeRankingItem[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyResponse | null>(null);
  const [isLoadingTopRooms, setIsLoadingTopRooms] = useState(true);
  const [isLoadingRanking, setIsLoadingRanking] = useState(true);
  const [isLoadingOccupancy, setIsLoadingOccupancy] = useState(true);

  const [logs, setLogs] = useState<AuditLogRow[]>([]);
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
      toast.error(getApiErrorMessage(error, "Error al cargar las habitaciones más usadas"));
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
      toast.error(getApiErrorMessage(error, "Error al cargar el ranking de empleados"));
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

  const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const res = await api.get(
        routes.api.auditLogs.list({
          tableName: tableName || undefined,
          employeeId: employeeId ? Number(employeeId) : undefined,
          from: from || undefined,
          to: to || undefined,
        }),
      );
      setLogs(res.data);
    } catch {
      toast.error("Error al cargar el registro de auditoría");
    } finally {
      setIsLoadingLogs(false);
    }
  }, [tableName, employeeId, from, to]);

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
    api
      .get(routes.api.employees.list())
      .then((res) => setEmployees(res.data))
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
    "h-11 px-3 rounded-xl border border-[#E6E0D1] bg-white text-[#1E251A] outline-none transition-all cursor-pointer focus:border-[#C2683E] focus:ring-2 focus:ring-[#C2683E]/20";

  const hasFilters = tableName || employeeId || from || to;

  return (
    <div
      className="-m-6 min-h-full p-6 md:-m-8 md:p-8"
      style={{ background: "#F4F0E6" }}
    >
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Cabecera */}
        <div className="flex flex-col gap-4 border-b border-[#E6E0D1] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              className="text-3xl font-bold tracking-tight text-[#1E251A] flex items-center gap-2"
              style={{ fontFamily: BRICOLAGE }}
            >
              <BarChart3 className="h-8 w-8 text-[#C2683E]" />
              Analíticas
            </h2>
            <p className="text-[#6E7567] mt-2 text-base">
              Ocupación, habitaciones más usadas, desempeño del personal y el
              registro de actividad del sistema.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#6E7567]">Año</label>
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
        <div className="bg-white rounded-2xl border border-[#E6E0D1] shadow-sm p-5">
          <h3
            className="text-lg font-semibold text-[#1E251A] flex items-center gap-2"
            style={{ fontFamily: BRICOLAGE }}
          >
            <CalendarRange className="h-5 w-5 text-[#C2683E]" />
            Ocupación mensual · {selectedYear}
          </h3>
          <p className="text-sm text-[#6E7567] mt-1 mb-4">
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
              <YAxis stroke={AXIS} fontSize={12} width={40} allowDecimals={false} />
              <Tooltip
                formatter={(value) => [String(value), "Reservas"]}
                cursor={{ fill: "rgba(194,104,62,0.08)" }}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="reservas" fill={ACCENT} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </div>

        {/* Top habitaciones */}
        <div className="bg-white rounded-2xl border border-[#E6E0D1] shadow-sm p-5">
          <h3
            className="text-lg font-semibold text-[#1E251A] flex items-center gap-2"
            style={{ fontFamily: BRICOLAGE }}
          >
            <BedDouble className="h-5 w-5 text-[#C2683E]" />
            Habitaciones más usadas
          </h3>
          <p className="text-sm text-[#6E7567] mt-1 mb-4">
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
              <YAxis stroke={AXIS} fontSize={12} width={40} allowDecimals={false} />
              <Tooltip
                formatter={(value, name) => [
                  String(value),
                  name === "noches" ? "Noches" : "Reservas",
                ]}
                cursor={{ fill: "rgba(194,104,62,0.08)" }}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="reservas" fill={ACCENT} radius={[6, 6, 0, 0]} />
              <Bar dataKey="noches" fill="#9AA08F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </div>

        {/* Ranking de empleados */}
        <div className="bg-white rounded-2xl border border-[#E6E0D1] shadow-sm p-5">
          <h3
            className="text-lg font-semibold text-[#1E251A] flex items-center gap-2"
            style={{ fontFamily: BRICOLAGE }}
          >
            <Users className="h-5 w-5 text-[#C2683E]" />
            Empleados destacados
          </h3>
          <p className="text-sm text-[#6E7567] mt-1 mb-4">
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
                cursor={{ fill: "rgba(194,104,62,0.08)" }}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="monto" fill={ACCENT} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ChartFrame>
        </div>

        {/* Registro de auditoría */}
        <div className="border-t border-[#E6E0D1] pt-6 mt-2">
          <h3
            className="text-2xl font-bold tracking-tight text-[#1E251A] flex items-center gap-2"
            style={{ fontFamily: BRICOLAGE }}
          >
            <ScrollText className="h-6 w-6 text-[#C2683E]" />
            Registro de actividad
          </h3>
          <p className="text-[#6E7567] mt-1 text-base">
            Consulta quién realizó cada acción sobre reservas, personal y
            habitaciones, y cuándo.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-2xl border border-[#E6E0D1] shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#6E7567]">
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
              <label className="text-sm font-semibold text-[#6E7567]">
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
                    {[emp.nombres, emp.apellidoPaterno].filter(Boolean).join(" ") ||
                      `Empleado #${emp.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#6E7567]">
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
              <label className="text-sm font-semibold text-[#6E7567]">
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
                className="h-11 px-4 rounded-xl border border-[#E6E0D1] bg-white text-sm font-semibold text-[#6E7567] transition-all hover:bg-[#F4F0E6] hover:text-[#1E251A]"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl border border-[#E6E0D1] shadow-sm overflow-hidden mb-8">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F4F0E6] hover:bg-[#F4F0E6] border-[#E6E0D1]">
                <TableHead className="font-semibold text-[#6E7567] py-4 pl-6">
                  Fecha y hora
                </TableHead>
                <TableHead className="font-semibold text-[#6E7567]">
                  Empleado
                </TableHead>
                <TableHead className="font-semibold text-[#6E7567]">
                  Acción
                </TableHead>
                <TableHead className="font-semibold text-[#6E7567]">
                  Entidad
                </TableHead>
                <TableHead className="font-semibold text-[#6E7567] text-right pr-6">
                  ID del registro
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingLogs ? (
                <TableRow className="border-[#E6E0D1]">
                  <TableCell colSpan={5} className="h-32 text-center text-[#6E7567]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-[#C2683E]" />
                      <span>Cargando registros...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow className="border-[#E6E0D1]">
                  <TableCell colSpan={5} className="h-32 text-center text-[#6E7567]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ScrollText className="h-6 w-6 text-[#9AA08F]" />
                      <span>No hay registros que coincidan con los filtros.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    onClick={() => setDetail(log)}
                    className="border-[#E6E0D1] transition-colors hover:bg-[#F4F0E6] group cursor-pointer"
                  >
                    <TableCell className="text-[#6E7567] pl-6">
                      {formatDateTime(log.performedAt)}
                    </TableCell>
                    <TableCell className="font-medium text-[#1E251A] group-hover:text-[#C2683E] transition-colors">
                      {employeeName(log.employee)}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action.name)}</TableCell>
                    <TableCell className="text-[#6E7567]">
                      {ENTITY_LABELS[log.tableName] ?? log.tableName}
                    </TableCell>
                    <TableCell className="text-right pr-6 text-[#6E7567]">
                      #{log.recordId}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Diálogo de detalle */}
      <Dialog
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="sm:max-w-[620px] rounded-2xl bg-white border-[#E6E0D1] text-[#1E251A]">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#1E251A]">
              Detalle del registro
            </DialogTitle>
            <DialogDescription className="text-[#6E7567]">
              {detail
                ? `${ACTION_LABELS[detail.action.name as ActionName] ?? detail.action.name} sobre ${ENTITY_LABELS[detail.tableName] ?? detail.tableName} #${detail.recordId}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {detail && (
            <div className="flex flex-col gap-4 mt-2">
              {/* Metadatos */}
              <div className="bg-[#F4F0E6] rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-[#6E7567]">Empleado</span>
                  <span className="font-semibold text-[#1E251A]">
                    {employeeName(detail.employee)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#6E7567]">Fecha y hora</span>
                  <span className="font-semibold text-[#1E251A]">
                    {formatDateTime(detail.performedAt)}
                  </span>
                </div>
              </div>

              {/* Antes / Después */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-[#6E7567]">
                    Antes
                  </span>
                  {formatJsonValue(detail.previousValue) ? (
                    <pre className="text-xs bg-[#F4F0E6] border border-[#E6E0D1] rounded-xl p-3 overflow-auto max-h-[280px] whitespace-pre-wrap break-words text-[#1E251A]">
                      {formatJsonValue(detail.previousValue)}
                    </pre>
                  ) : (
                    <p className="text-xs text-[#6E7567] bg-[#F4F0E6] border border-[#E6E0D1] rounded-xl p-3">
                      Sin datos previos.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-[#6E7567]">
                    Después
                  </span>
                  {formatJsonValue(detail.newValue) ? (
                    <pre className="text-xs bg-[#F4F0E6] border border-[#E6E0D1] rounded-xl p-3 overflow-auto max-h-[280px] whitespace-pre-wrap break-words text-[#1E251A]">
                      {formatJsonValue(detail.newValue)}
                    </pre>
                  ) : (
                    <p className="text-xs text-[#6E7567] bg-[#F4F0E6] border border-[#E6E0D1] rounded-xl p-3">
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
