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

interface RawTopRoomRow {
  number: string;
  type: string | null;
  reservations: number;
  nights: number;
}

interface RawEmployeeRankingRow {
  employeeId: number;
  firstName: string | null;
  lastName: string | null;
  charges: number;
  chargesTotal: string | null;
}

interface RawOccupancyRow {
  month: number;
  reservations: number;
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

  async getTopRooms() {
    const rows = await this.prisma.$queryRaw<RawTopRoomRow[]>`
      SELECT
        r."number"                                                       AS "number",
        rt."name"                                                        AS "type",
        COUNT(res."id")::int                                             AS "reservations",
        COALESCE(SUM(EXTRACT(EPOCH FROM (res."checkOut" - res."checkIn")) / 86400), 0)::int AS "nights"
      FROM "Reservation" res
      JOIN "Room" r ON r."id" = res."roomId"
      LEFT JOIN "RoomType" rt ON rt."id" = r."typeId"
      LEFT JOIN "ReservationStatus" rs ON rs."id" = res."statusId"
      WHERE rs."name" IS DISTINCT FROM 'CANCELLED'
      GROUP BY r."id", r."number", rt."name"
      ORDER BY "reservations" DESC, "nights" DESC
      LIMIT 10
    `;

    return rows.map((row) => ({
      number: row.number,
      type: row.type,
      reservations: row.reservations,
      nights: row.nights,
    }));
  }

  async getEmployeeRanking() {
    const rows = await this.prisma.$queryRaw<RawEmployeeRankingRow[]>`
      SELECT
        e."id"           AS "employeeId",
        e."firstName"    AS "firstName",
        e."lastName"     AS "lastName",
        COUNT(rc."id")::int AS "charges",
        COALESCE(SUM(rc."amount"), 0) AS "chargesTotal"
      FROM "RoomCharge" rc
      JOIN "Employee" e ON e."id" = rc."registeredBy"
      WHERE e."role" <> 'OWNER'
      GROUP BY e."id", e."firstName", e."lastName"
      ORDER BY "chargesTotal" DESC, "charges" DESC
      LIMIT 10
    `;

    return rows.map((row) => ({
      employeeId: row.employeeId,
      firstName: row.firstName,
      lastName: row.lastName,
      charges: row.charges,
      chargesTotal: this.toAmount(row.chargesTotal),
    }));
  }

  async getOccupancy(year: number) {
    const rows = await this.prisma.$queryRaw<RawOccupancyRow[]>`
      SELECT
        gs.m::int          AS "month",
        COUNT(res."id")::int AS "reservations"
      FROM generate_series(1, 12) AS gs(m)
      LEFT JOIN (
        SELECT res."id", res."checkIn", res."checkOut"
        FROM "Reservation" res
        LEFT JOIN "ReservationStatus" rs ON rs."id" = res."statusId"
        WHERE rs."name" IS DISTINCT FROM 'CANCELLED'
      ) res
        ON res."checkIn"  <  (make_date(${year}, gs.m::int, 1) + interval '1 month')
       AND res."checkOut" >  make_date(${year}, gs.m::int, 1)
      GROUP BY gs.m
      ORDER BY gs.m
    `;

    const byMonth = new Map(rows.map((row) => [row.month, row.reservations]));

    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      return { month, reservations: byMonth.get(month) ?? 0 };
    });

    return { year, months };
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
