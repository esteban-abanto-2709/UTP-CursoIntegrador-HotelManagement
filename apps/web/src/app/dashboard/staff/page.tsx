"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Users, Loader2, ClipboardList } from "lucide-react";

import api from "@/lib/axios";
import { routes } from "@/lib/routes";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { EmployeeFormDialog } from "./EmployeeFormDialog";

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
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(routes.api.employees.list());
      setEmployees(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la lista de personal.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return (
          <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
            PROPIETARIO
          </span>
        );
      case "MANAGER":
        return (
          <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-400 ring-1 ring-inset ring-purple-500/20">
            GERENTE
          </span>
        );
      case "EMPLOYEE":
        return (
          <span className="inline-flex items-center rounded-full bg-sky-500/10 px-2 py-1 text-xs font-medium text-sky-400 ring-1 ring-inset ring-sky-500/20">
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
      MAÑANA: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
      TARDE: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
      NOCHE: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
    };
    const labels: Record<string, string> = {
      MAÑANA: "Mañana",
      TARDE: "Tarde",
      NOCHE: "Noche",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${colors[turno] ?? ""}`}>
        {labels[turno] ?? turno}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-8">
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

        <Button onClick={() => setIsFormOpen(true)}>
          <ClipboardList className="mr-2 h-4 w-4" />
          Registrar Empleado
        </Button>
      </div>

      <EmployeeFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={fetchEmployees}
      />

      {/* Tabla */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-semibold">Nombre</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Usuario</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Cargo</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Turno</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Rol</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Cargando personal...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium">
                  No se encontraron empleados en el sistema.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((e) => (
                <TableRow key={e.id} className="border-border hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-foreground">
                    {e.nombres
                      ? `${e.nombres} ${e.apellidoPaterno ?? ""}`.trim()
                      : <span className="text-muted-foreground">—</span>
                    }
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.username}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.cargo ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>{getTurnoBadge(e.turno)}</TableCell>
                  <TableCell>{getRoleBadge(e.role)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" disabled>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
