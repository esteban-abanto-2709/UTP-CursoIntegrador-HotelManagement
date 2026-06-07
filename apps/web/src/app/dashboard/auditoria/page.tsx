"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import { Loader2, ScrollText } from "lucide-react";

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
  DELETE:
    "bg-status-maintenance-bg text-status-maintenance-text border-status-maintenance-border",
  CHECKIN:
    "bg-status-occupied-bg text-status-occupied-text border-status-occupied-border",
  CHECKOUT:
    "bg-status-occupied-bg text-status-occupied-text border-status-occupied-border",
  CANCEL:
    "bg-status-maintenance-bg text-status-maintenance-text border-status-maintenance-border",
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
    ACTION_STYLES[action] ??
    "bg-muted text-muted-foreground border-border/50";
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

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState<AuditLogRow | null>(null);

  const [tableName, setTableName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [tableName, employeeId, from, to]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    api
      .get(routes.api.employees.list())
      .then((res) => setEmployees(res.data))
      .catch(() => toast.error("Error al cargar la lista de empleados"));
  }, []);

  const selectClass =
    "h-11 px-3 rounded-xl border border-border/50 bg-background text-foreground focus:ring-2 focus:border-primary focus:ring-primary/20 outline-none transition-all cursor-pointer";

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cabecera */}
      <div className="border-b pb-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Registro de Auditoría
        </h2>
        <p className="text-muted-foreground mt-2 text-base">
          Consulta quién realizó cada acción sobre reservas, personal y
          habitaciones, y cuándo.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
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
                  {[emp.nombres, emp.apellidoPaterno].filter(Boolean).join(" ") ||
                    `Empleado #${emp.id}`}
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

          {(tableName || employeeId || from || to) && (
            <button
              onClick={() => {
                setTableName("");
                setEmployeeId("");
                setFrom("");
                setTo("");
              }}
              className="h-11 px-4 rounded-xl border border-border/50 bg-background text-sm font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden mb-8">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Cargando registros...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ScrollText className="h-6 w-6 text-muted-foreground" />
                    <span>No hay registros que coincidan con los filtros.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  onClick={() => setDetail(log)}
                  className="transition-colors hover:bg-muted/50 group cursor-pointer"
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
      </div>

      {/* Diálogo de detalle */}
      <Dialog
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="sm:max-w-[620px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Detalle del registro</DialogTitle>
            <DialogDescription>
              {detail
                ? `${ACTION_LABELS[detail.action.name as ActionName] ?? detail.action.name} sobre ${ENTITY_LABELS[detail.tableName] ?? detail.tableName} #${detail.recordId}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {detail && (
            <div className="flex flex-col gap-4 mt-2">
              {/* Metadatos */}
              <div className="bg-muted rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Empleado</span>
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
                    <pre className="text-xs bg-background border border-border/50 rounded-xl p-3 overflow-auto max-h-[280px] whitespace-pre-wrap break-words">
                      {formatJsonValue(detail.previousValue)}
                    </pre>
                  ) : (
                    <p className="text-xs text-muted-foreground bg-background border border-border/50 rounded-xl p-3">
                      Sin datos previos.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Después
                  </span>
                  {formatJsonValue(detail.newValue) ? (
                    <pre className="text-xs bg-background border border-border/50 rounded-xl p-3 overflow-auto max-h-[280px] whitespace-pre-wrap break-words">
                      {formatJsonValue(detail.newValue)}
                    </pre>
                  ) : (
                    <p className="text-xs text-muted-foreground bg-background border border-border/50 rounded-xl p-3">
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
