"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Users, Loader2, ClipboardList, Pencil, Lock } from "lucide-react";

import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PaginationControls } from "@/components/ui/pagination-controls";

import { EmployeeFormDialog, EmployeeDetail } from "./EmployeeFormDialog";

const PAGE_SIZE = 20;

interface EmployeeData {
  id: number;
  username: string;
  role: string;
  nombres: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  cargo: string | null;
  turno: string | null;
  createdAt: string;
}

export default function StaffPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [cursorStack, setCursorStack] = useState<(number | null)[]>([null]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDetail | null>(
    null,
  );
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);

  const cursor = cursorStack[cursorStack.length - 1];

  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(
        routes.api.employees.list({
          cursor: cursor ?? undefined,
          take: PAGE_SIZE,
        }),
      );
      setEmployees(response.data.data);
      setTotal(response.data.total);
      setNextCursor(response.data.nextCursor);
      setHasNext(response.data.hasNext);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la lista de personal.");
    } finally {
      setIsLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleNextPage = () => {
    if (hasNext && nextCursor != null) {
      setCursorStack((s) => [...s, nextCursor]);
    }
  };

  const handlePrevPage = () => {
    setCursorStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  };

  // Un MANAGER solo puede editar EMPLEADOS; el OWNER puede editar a cualquiera
  const canEdit = (role: string) =>
    currentUser?.role === "OWNER" || role === "EMPLOYEE";

  const openCreate = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const openEdit = async (id: number) => {
    setLoadingDetailId(id);
    try {
      const response = await api.get(routes.api.employees.getOne(id));
      setEditingEmployee(response.data);
      setIsFormOpen(true);
    } catch {
      toast.error("No se pudo cargar la información del empleado.");
    } finally {
      setLoadingDetailId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
            PROPIETARIO
          </span>
        );
      case "MANAGER":
        return (
          <span className="inline-flex items-center rounded-full bg-status-occupied-bg px-2 py-1 text-xs font-medium text-status-occupied-text ring-1 ring-inset ring-status-occupied-border">
            GERENTE
          </span>
        );
      case "EMPLOYEE":
        return (
          <span className="inline-flex items-center rounded-full bg-status-available-bg px-2 py-1 text-xs font-medium text-status-available-text ring-1 ring-inset ring-status-available-border">
            EMPLEADO
          </span>
        );
      default:
        return <span>{role}</span>;
    }
  };

  const getTurnoBadge = (turno: string | null) => {
    if (!turno) return <span className="text-muted-foreground">—</span>;
    const colors: Record<string, string> = {
      MAÑANA:
        "bg-status-cleaning-bg text-status-cleaning-text ring-status-cleaning-border",
      TARDE:
        "bg-status-maintenance-bg text-status-maintenance-text ring-status-maintenance-border",
      NOCHE:
        "bg-status-occupied-bg text-status-occupied-text ring-status-occupied-border",
    };
    const labels: Record<string, string> = {
      MAÑANA: "Mañana",
      TARDE: "Tarde",
      NOCHE: "Noche",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${colors[turno] ?? ""}`}
      >
        {labels[turno] ?? turno}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Gestión de Personal
          </h2>
          <p className="text-muted-foreground mt-1">
            Administra los accesos y roles del equipo del hotel.
          </p>
        </div>

        <Button onClick={openCreate}>
          <ClipboardList className="mr-2 h-4 w-4" />
          Registrar Empleado
        </Button>
      </div>

      <EmployeeFormDialog
        key={editingEmployee?.id ?? "new"}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingEmployee(null);
        }}
        onSuccess={fetchEmployees}
        employee={editingEmployee}
      />

      {/* Tabla */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-semibold">
                Nombre
              </TableHead>
              <TableHead className="text-muted-foreground font-semibold">
                Usuario
              </TableHead>
              <TableHead className="text-muted-foreground font-semibold">
                Cargo
              </TableHead>
              <TableHead className="text-muted-foreground font-semibold">
                Turno
              </TableHead>
              <TableHead className="text-muted-foreground font-semibold">
                Rol
              </TableHead>
              <TableHead className="text-muted-foreground font-semibold text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Cargando personal...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground font-medium"
                >
                  No se encontraron empleados en el sistema.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((e) => (
                <TableRow
                  key={e.id}
                  className="border-border hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    {e.nombres ? (
                      `${e.nombres} ${e.apellidoPaterno ?? ""}`.trim()
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.username}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.cargo ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getTurnoBadge(e.turno)}</TableCell>
                  <TableCell>{getRoleBadge(e.role)}</TableCell>
                  <TableCell className="text-right">
                    {canEdit(e.role) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(e.id)}
                        disabled={loadingDetailId === e.id}
                      >
                        {loadingDetailId === e.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Editar
                      </Button>
                    ) : (
                      <span
                        title="Solo el propietario puede editar a un gerente"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 cursor-not-allowed px-3 py-1.5"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Bloqueado
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!isLoading && total > 0 && (
          <div className="px-6 py-4 border-t border-border/50">
            <PaginationControls
              total={total}
              hasPrev={cursorStack.length > 1}
              hasNext={hasNext}
              onPrev={handlePrevPage}
              onNext={handleNextPage}
              disabled={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
