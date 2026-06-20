import { Loader2 } from "lucide-react";
import { ResponsiveContainer } from "recharts";

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

// Paleta Mirador
export const ACCENT = "#C2683E";
export const GRID = "#E6E0D1";
export const AXIS = "#9AA08F";
export const BRICOLAGE =
  "var(--font-bricolage), 'Bricolage Grotesque', sans-serif";

export const tooltipStyle = {
  background: "#fff",
  border: `1px solid ${GRID}`,
  borderRadius: "0.75rem",
  color: "#1E251A",
};

const penFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

export function formatPEN(value: number) {
  return penFormatter.format(value);
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  const err = error as { response?: { data?: { message?: string | string[] } } };
  const raw = err.response?.data?.message;
  return (Array.isArray(raw) ? raw[0] : raw) || fallback;
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
    <div className="bg-white rounded-2xl border border-[#E6E0D1] shadow-sm p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[#6E7567]">
        <span className="text-[#C2683E]">{icon}</span>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-[#C2683E]" />
      ) : (
        <span
          className="text-2xl font-bold text-[#1E251A]"
          style={{ fontFamily: BRICOLAGE }}
        >
          {value}
        </span>
      )}
      <span className="text-xs text-[#9AA08F]">{hint}</span>
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
      <div className="flex h-72 items-center justify-center text-[#9AA08F]">
        <Loader2 className="h-6 w-6 animate-spin text-[#C2683E]" />
      </div>
    );
  }
  if (empty) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-[#9AA08F]">
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
