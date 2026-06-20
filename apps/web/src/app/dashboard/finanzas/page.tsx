"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { routes } from "@/lib/routes";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { TrendingUp, Receipt, CreditCard, Tag, Wallet } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  ACCENT,
  GRID,
  AXIS,
  BRICOLAGE,
  MONTH_LABELS,
  tooltipStyle,
  formatPEN,
  getApiErrorMessage,
  KpiCard,
  ChartFrame,
} from "@/lib/analytics-ui";

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

export default function FinanzasPage() {
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
      toast.error(
        getApiErrorMessage(error, "Error al cargar los ingresos anuales"),
      );
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
      toast.error(
        getApiErrorMessage(error, "Error al cargar los ingresos mensuales"),
      );
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

  return (
    <div className="-m-6 min-h-full bg-background p-6 md:-m-8 md:p-8">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Cabecera */}
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2"
              style={{ fontFamily: BRICOLAGE }}
            >
              <Wallet className="h-8 w-8 text-primary" />
              Finanzas
            </h2>
            <p className="text-muted-foreground mt-2 text-base">
              Ingresos brutos, pagos procesados y descuentos del hotel,
              derivados de los pagos cobrados a los huéspedes.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-11 px-3 rounded-xl border border-border bg-card text-foreground outline-none transition-all cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/20"
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
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h3
            className="text-lg font-semibold text-foreground"
            style={{ fontFamily: BRICOLAGE }}
          >
            Ingreso bruto mensual · {selectedYear}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
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
                cursor={{
                  fill: "color-mix(in srgb, var(--primary) 8%, transparent)",
                }}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="ingreso" fill={ACCENT} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </div>

        {/* Ingreso anual */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 mb-8">
          <h3
            className="text-lg font-semibold text-foreground"
            style={{ fontFamily: BRICOLAGE }}
          >
            Ingreso bruto anual
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Evolución del ingreso bruto por año.
          </p>
          <ChartFrame
            loading={isLoadingAnnual}
            empty={annualChartData.length === 0}
          >
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
