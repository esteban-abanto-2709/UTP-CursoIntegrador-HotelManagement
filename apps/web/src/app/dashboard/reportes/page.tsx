"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  Loader2,
  TrendingUp,
  Receipt,
  CreditCard,
  Tag,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface RevenuePoint {
  grossRevenue: number;
  roomTotal: number;
  chargesTotal: number;
  discountAmount: number;
  paymentsCount: number;
}

interface MonthlyPoint extends RevenuePoint {
  month: number;
}

interface MonthlyResponse {
  year: number;
  months: MonthlyPoint[];
}

interface AnnualPoint extends RevenuePoint {
  year: number;
}

const MONTH_LABELS = [
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
const ACCENT = "#C2683E";
const GRID = "#E6E0D1";
const AXIS = "#9AA08F";
const BRICOLAGE = "var(--font-bricolage), 'Bricolage Grotesque', sans-serif";

const penFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

function formatPEN(value: number) {
  return penFormatter.format(value);
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const err = error as { response?: { data?: { message?: string | string[] } } };
  const raw = err.response?.data?.message;
  return (Array.isArray(raw) ? raw[0] : raw) || fallback;
}

export default function ReportesPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [annual, setAnnual] = useState<AnnualPoint[]>([]);
  const [monthly, setMonthly] = useState<MonthlyResponse | null>(null);
  const [isLoadingAnnual, setIsLoadingAnnual] = useState(true);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(true);

  // Guard de rol (coherente con TD-008): los no-OWNER no deberían ver esta página.
  useEffect(() => {
    if (user && user.role !== "OWNER") {
      router.replace(routes.dashboard.home());
    }
  }, [user, router]);

  const fetchAnnual = useCallback(async () => {
    setIsLoadingAnnual(true);
    try {
      const res = await api.get(routes.api.analytics.annualRevenue());
      setAnnual(res.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Error al cargar los ingresos anuales"));
    } finally {
      setIsLoadingAnnual(false);
    }
  }, []);

  const fetchMonthly = useCallback(async (year: number) => {
    setIsLoadingMonthly(true);
    try {
      const res = await api.get(routes.api.analytics.monthlyRevenue(year));
      setMonthly(res.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Error al cargar los ingresos mensuales"));
    } finally {
      setIsLoadingMonthly(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnual();
  }, [fetchAnnual]);

  useEffect(() => {
    fetchMonthly(selectedYear);
  }, [fetchMonthly, selectedYear]);

  const yearOptions = useMemo(() => {
    const years = new Set(annual.map((point) => point.year));
    years.add(new Date().getFullYear());
    years.add(selectedYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [annual, selectedYear]);

  const yearTotals = useMemo<RevenuePoint>(() => {
    const empty: RevenuePoint = {
      grossRevenue: 0,
      roomTotal: 0,
      chargesTotal: 0,
      discountAmount: 0,
      paymentsCount: 0,
    };
    if (!monthly) return empty;
    return monthly.months.reduce(
      (acc, month) => ({
        grossRevenue: acc.grossRevenue + month.grossRevenue,
        roomTotal: acc.roomTotal + month.roomTotal,
        chargesTotal: acc.chargesTotal + month.chargesTotal,
        discountAmount: acc.discountAmount + month.discountAmount,
        paymentsCount: acc.paymentsCount + month.paymentsCount,
      }),
      empty,
    );
  }, [monthly]);

  const averageTicket =
    yearTotals.paymentsCount > 0
      ? yearTotals.grossRevenue / yearTotals.paymentsCount
      : 0;

  const monthlyChartData = useMemo(
    () =>
      (monthly?.months ?? []).map((month) => ({
        name: MONTH_LABELS[month.month - 1],
        ingreso: month.grossRevenue,
      })),
    [monthly],
  );

  const annualChartData = useMemo(
    () =>
      annual.map((point) => ({
        name: String(point.year),
        ingreso: point.grossRevenue,
      })),
    [annual],
  );

  if (user && user.role !== "OWNER") {
    return null;
  }

  const tooltipStyle = {
    background: "#fff",
    border: `1px solid ${GRID}`,
    borderRadius: "0.75rem",
    color: "#1E251A",
  };

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
              <TrendingUp className="h-8 w-8 text-[#C2683E]" />
              Reportes de Ingresos
            </h2>
            <p className="text-[#6E7567] mt-2 text-base">
              Ingreso bruto del hotel agregado por mes y por año, derivado de los
              pagos registrados.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#6E7567]">Año</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-11 px-3 rounded-xl border border-[#E6E0D1] bg-white text-[#1E251A] outline-none transition-all cursor-pointer focus:border-[#C2683E] focus:ring-2 focus:ring-[#C2683E]/20"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={<TrendingUp className="h-5 w-5" />}
            label={`Ingreso bruto ${selectedYear}`}
            value={formatPEN(yearTotals.grossRevenue)}
            hint={`Habitaciones ${formatPEN(yearTotals.roomTotal)} · Consumos ${formatPEN(yearTotals.chargesTotal)}`}
            loading={isLoadingMonthly}
          />
          <KpiCard
            icon={<Receipt className="h-5 w-5" />}
            label="Pagos procesados"
            value={String(yearTotals.paymentsCount)}
            hint={`En ${selectedYear}`}
            loading={isLoadingMonthly}
          />
          <KpiCard
            icon={<CreditCard className="h-5 w-5" />}
            label="Ticket promedio"
            value={formatPEN(averageTicket)}
            hint="Ingreso bruto / pagos"
            loading={isLoadingMonthly}
          />
          <KpiCard
            icon={<Tag className="h-5 w-5" />}
            label="Descuentos otorgados"
            value={formatPEN(yearTotals.discountAmount)}
            hint={`En ${selectedYear}`}
            loading={isLoadingMonthly}
          />
        </div>

        {/* Ingreso mensual */}
        <div className="bg-white rounded-2xl border border-[#E6E0D1] shadow-sm p-5">
          <h3
            className="text-lg font-semibold text-[#1E251A]"
            style={{ fontFamily: BRICOLAGE }}
          >
            Ingreso bruto mensual · {selectedYear}
          </h3>
          <p className="text-sm text-[#6E7567] mt-1 mb-4">
            Suma de los pagos cobrados en cada mes.
          </p>
          <ChartFrame loading={isLoadingMonthly}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="name" stroke={AXIS} fontSize={12} />
              <YAxis
                stroke={AXIS}
                fontSize={12}
                width={80}
                tickFormatter={(value: number) => formatPEN(value)}
              />
              <Tooltip
                formatter={(value) => [formatPEN(Number(value)), "Ingreso"]}
                cursor={{ fill: "rgba(194,104,62,0.08)" }}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="ingreso" fill={ACCENT} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </div>

        {/* Ingreso anual */}
        <div className="bg-white rounded-2xl border border-[#E6E0D1] shadow-sm p-5 mb-8">
          <h3
            className="text-lg font-semibold text-[#1E251A]"
            style={{ fontFamily: BRICOLAGE }}
          >
            Ingreso bruto anual
          </h3>
          <p className="text-sm text-[#6E7567] mt-1 mb-4">
            Evolución del ingreso bruto por año.
          </p>
          <ChartFrame loading={isLoadingAnnual} empty={annualChartData.length === 0}>
            <LineChart data={annualChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="name" stroke={AXIS} fontSize={12} />
              <YAxis
                stroke={AXIS}
                fontSize={12}
                width={80}
                tickFormatter={(value: number) => formatPEN(value)}
              />
              <Tooltip
                formatter={(value) => [formatPEN(Number(value)), "Ingreso"]}
                contentStyle={tooltipStyle}
              />
              <Line
                type="monotone"
                dataKey="ingreso"
                stroke={ACCENT}
                strokeWidth={2}
                dot={{ r: 4, fill: ACCENT }}
              />
            </LineChart>
          </ChartFrame>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
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

function ChartFrame({
  loading,
  empty = false,
  children,
}: {
  loading: boolean;
  empty?: boolean;
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
        Aún no hay pagos registrados.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={288}>
      {children}
    </ResponsiveContainer>
  );
}
