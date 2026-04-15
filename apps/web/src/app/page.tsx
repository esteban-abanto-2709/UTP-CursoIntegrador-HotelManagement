import { mockRooms } from "@/lib/mocks"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Recepción</h2>
        <p className="text-muted-foreground">
          Aquí construiremos el grid de habitaciones en el próximo paso.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Tarjetas demostrativas simples (solo para verificar el Layout) */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="font-semibold leading-none tracking-tight">Disponibles</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {mockRooms.filter(r => r.status === "disponible").length} habitaciones
          </p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="font-semibold leading-none tracking-tight">Ocupadas</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {mockRooms.filter(r => r.status === "ocupada").length} habitaciones
          </p>
        </div>
      </div>
    </div>
  );
}
