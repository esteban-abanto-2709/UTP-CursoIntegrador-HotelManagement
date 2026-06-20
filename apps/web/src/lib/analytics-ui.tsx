import { Loader2 } from "lucide-react";
import { ResponsiveContainer } from "recharts";

export { getApiErrorMessage } from "@/lib/api-error";

export const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

// Paleta Mirador (vía tokens CSS — Recharts requiere valores, no clases)
export const ACCENT = "var(--primary)";
export const GRID = "var(--border)";
export const AXIS = "var(--muted-soft)";
export const BRICOLAGE = "var(--font-bricolage), sans-serif";

export const tooltipStyle = {
  background: "var(--card)",
  border: `1px solid var(--border)`,
  borderRadius: "0.75rem",
  color: "var(--foreground)",
};

const penFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

export function formatPEN(value: number) {
  return penFormatter.format(value);
}

export function KpiCard({
  icon,
  label,
  value,
  hint,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  loading: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-primary">{icon}</span>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <span className="font-heading text-2xl font-bold text-foreground">
          {value}
        </span>
      )}
      <span className="text-xs text-muted-soft">{hint}</span>
    </div>
  );
}

export function ChartFrame({
  loading,
  empty = false,
  emptyLabel = "Aún no hay pagos registrados.",
  children,
}: {
  loading: boolean;
  empty?: boolean;
  emptyLabel?: string;
  children: React.ReactElement;
}) {
  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center text-muted-soft">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (empty) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-soft">
        {emptyLabel}
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={288}>
      {children}
    </ResponsiveContainer>
  );
}
