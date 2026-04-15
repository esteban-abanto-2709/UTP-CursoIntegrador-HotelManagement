"use client";

import { useState } from "react";
import { mockReservations, Reservation } from "@/lib/mocks";
import { Search, Plus } from "lucide-react";

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

export default function ReservasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  // Estado local para simular base de datos
  const [reservas, setReservas] = useState<Reservation[]>(mockReservations);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredReservas = reservas.filter(
    (res) =>
      res.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.dni.includes(searchTerm),
  );

  const handleAddReservation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newReservation: Reservation = {
      id: `RES-00${reservas.length + 1}`,
      guestName: formData.get("guestName") as string,
      dni: formData.get("dni") as string,
      roomId: formData.get("roomId") as string,
      checkIn: formData.get("checkIn") as string,
      checkOut: formData.get("checkOut") as string,
      status: "pendiente",
    };

    // Mantenemos la nueva reserva en el estado simulado (fácil de reemplazar por POST)
    setReservas([...reservas, newReservation]);
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "activa":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200">
            En Hotel (Activa)
          </span>
        );
      case "pendiente":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-semibold border border-amber-200">
            Próximos a llegar
          </span>
        );
      case "completada":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
            Finalizada
          </span>
        );
      case "cancelada":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-zinc-100 text-zinc-700 font-semibold border border-zinc-200">
            Cancelada
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-zinc-100 text-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Gestión de Reservas
          </h2>
          <p className="text-zinc-500 mt-2 text-base">
            Administra el historial y controla los próximos ingresos para evitar
            overbooking al 100%.
          </p>
        </div>

        {/* Modal Nueva Reserva */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-zinc-800 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" /> Nueva Reserva
        </button>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[450px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Añadir Nueva Reserva
              </DialogTitle>
              <DialogDescription>
                Registra los datos del huésped para apartar de manera segura una
                habitación en las fechas solicitadas.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleAddReservation}
              className="flex flex-col gap-4 mt-2"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-700">
                  Nombre del Huésped Completo
                </label>
                <input
                  name="guestName"
                  required
                  className="h-10 px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:border-transparent focus:ring-primary/20 outline-none transition-all bg-zinc-50 focus:bg-white"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-700">
                  DNI / Documento Identidad
                </label>
                <input
                  name="dni"
                  required
                  className="h-10 px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:border-transparent focus:ring-primary/20 outline-none transition-all bg-zinc-50 focus:bg-white"
                  placeholder="Ej. 12345678"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-semibold text-zinc-700">
                    Fecha de Entrada
                  </label>
                  <input
                    name="checkIn"
                    type="date"
                    required
                    className="h-10 px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:border-transparent focus:ring-primary/20 outline-none transition-all bg-zinc-50 focus:bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-semibold text-zinc-700">
                    Fecha de Salida
                  </label>
                  <input
                    name="checkOut"
                    type="date"
                    required
                    className="h-10 px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:border-transparent focus:ring-primary/20 outline-none transition-all bg-zinc-50 focus:bg-white"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-sm font-semibold text-zinc-700">
                  Asignar Habitación
                </label>
                <select
                  name="roomId"
                  required
                  className="h-10 px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:border-transparent focus:ring-primary/20 outline-none transition-all bg-zinc-50 focus:bg-white cursor-pointer"
                >
                  <option value="">Seleccione un cuarto disponible...</option>
                  <option value="101">Cuarto 101 - Sencilla</option>
                  <option value="104">Cuarto 104 - Sencilla</option>
                  <option value="201">Cuarto 201 - Doble</option>
                  <option value="204">Cuarto 204 - Doble</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground h-11 rounded-lg font-semibold shadow hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                Confirmar y Registrar
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cuadro de Búsqueda Falsa */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="🔎 Buscar una reserva por Documento o Nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* Tabla de Reservas */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden mb-8">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
              <TableHead className="font-semibold text-zinc-500 py-4 w-[110px]">
                ID Reserva
              </TableHead>
              <TableHead className="font-semibold text-zinc-500">
                Huésped
              </TableHead>
              <TableHead className="font-semibold text-zinc-500">
                Documento
              </TableHead>
              <TableHead className="font-semibold text-zinc-500">
                Alojamiento
              </TableHead>
              <TableHead className="font-semibold text-zinc-500">
                Fechas (In - Out)
              </TableHead>
              <TableHead className="font-semibold text-zinc-500 text-right">
                Estado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReservas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-zinc-500"
                >
                  No se encontraron reservaciones que coincidan con{" "}
                  <b>&quot;{searchTerm}&quot;</b>.
                </TableCell>
              </TableRow>
            ) : (
              filteredReservas.map((res) => (
                <TableRow
                  key={res.id}
                  className="cursor-pointer transition-colors hover:bg-zinc-50/80 group"
                >
                  <TableCell className="font-bold text-zinc-800">
                    {res.id}
                  </TableCell>
                  <TableCell className="font-medium text-zinc-900 group-hover:text-primary transition-colors">
                    {res.guestName}
                  </TableCell>
                  <TableCell className="text-zinc-500">{res.dni}</TableCell>
                  <TableCell>
                    <span className="bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-md text-xs font-bold border">
                      Cto. {res.roomId}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-500">
                    {res.checkIn} <span className="opacity-50">→</span>{" "}
                    {res.checkOut}
                  </TableCell>
                  <TableCell className="text-right">
                    {getStatusBadge(res.status)}
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
