import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';

interface RawRevenueRow {
  period: number;
  grossRevenue: string | null;
  roomTotal: string | null;
  chargesTotal: string | null;
  discountAmount: string | null;
  paymentsCount: number;
}

interface RevenueTotals {
  grossRevenue: number;
  roomTotal: number;
  chargesTotal: number;
  discountAmount: number;
  paymentsCount: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getMonthlyRevenue(year: number) {
    const rows = await this.prisma.$queryRaw<RawRevenueRow[]>`
      SELECT
        EXTRACT(MONTH FROM "processedAt")::int AS "period",
        SUM("grandTotal")    AS "grossRevenue",
        SUM("roomTotal")     AS "roomTotal",
        SUM("chargesTotal")  AS "chargesTotal",
        SUM("discountAmount") AS "discountAmount",
        COUNT(*)::int        AS "paymentsCount"
      FROM "Payment"
      WHERE EXTRACT(YEAR FROM "processedAt") = ${year}
      GROUP BY "period"
      ORDER BY "period"
    `;

    const byMonth = new Map(rows.map((row) => [row.period, this.toTotals(row)]));

    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      return { month, ...(byMonth.get(month) ?? this.emptyTotals()) };
    });

    return { year, months };
  }

  async getAnnualRevenue() {
    const rows = await this.prisma.$queryRaw<RawRevenueRow[]>`
      SELECT
        EXTRACT(YEAR FROM "processedAt")::int AS "period",
        SUM("grandTotal")    AS "grossRevenue",
        SUM("roomTotal")     AS "roomTotal",
        SUM("chargesTotal")  AS "chargesTotal",
        SUM("discountAmount") AS "discountAmount",
        COUNT(*)::int        AS "paymentsCount"
      FROM "Payment"
      GROUP BY "period"
      ORDER BY "period"
    `;

    return rows.map((row) => ({ year: row.period, ...this.toTotals(row) }));
  }

  private toTotals(row: RawRevenueRow): RevenueTotals {
    return {
      grossRevenue: this.toAmount(row.grossRevenue),
      roomTotal: this.toAmount(row.roomTotal),
      chargesTotal: this.toAmount(row.chargesTotal),
      discountAmount: this.toAmount(row.discountAmount),
      paymentsCount: row.paymentsCount,
    };
  }

  private emptyTotals(): RevenueTotals {
    return {
      grossRevenue: 0,
      roomTotal: 0,
      chargesTotal: 0,
      discountAmount: 0,
      paymentsCount: 0,
    };
  }

  private toAmount(value: string | null): number {
    if (value === null) return 0;
    return Math.round(Number(value) * 100) / 100;
  }
}
