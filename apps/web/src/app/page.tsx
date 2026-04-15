import { mockRooms } from "@/lib/mocks";
import { BedDouble, CheckCircle2, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const disponibles = mockRooms.filter(r => r.status === "disponible").length;
  const ocupadas = mockRooms.filter(r => r.status === "ocupada").length;
  const limpieza = mockRooms.filter(r => r.status === "limpieza").length;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Vista General de Recepción</h2>
          <p className="text-zinc-500 mt-2 text-base">
            Monitorea la disponibilidad y el estado en tiempo real de las habitaciones del hotel.
          </p>
        </div>
      </div>

      {/* Tarjetas KPI Superiores (Estilo Premium) */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Tarjeta Disponibles */}
        <div className="relative overflow-hidden rounded-2xl border bg-white/70 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold tracking-tight text-zinc-600">Disponibles</h3>
            <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5"/>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-zinc-900">{disponibles}</span>
            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Listas para Check-in</span>
          </div>
        </div>

        {/* Tarjeta Ocupadas */}
        <div className="relative overflow-hidden rounded-2xl border bg-white/70 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold tracking-tight text-zinc-600">Ocupadas</h3>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <BedDouble className="w-5 h-5"/>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-zinc-900">{ocupadas}</span>
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Huéspedes activos</span>
          </div>
        </div>

        {/* Tarjeta Limpieza */}
        <div className="relative overflow-hidden rounded-2xl border bg-white/70 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold tracking-tight text-zinc-600">Limpieza Pendiente</h3>
            <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
              <AlertCircle className="w-5 h-5"/>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-zinc-900">{limpieza}</span>
            <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Requieren atención</span>
          </div>
        </div>

      </div>
    </div>
  );
}
