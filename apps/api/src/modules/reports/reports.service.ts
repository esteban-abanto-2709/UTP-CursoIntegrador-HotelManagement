import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';

interface SheetColumn {
  header: string;
  key: string;
  width?: number;
  numFmt?: string;
}

const MONTH_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const PEN_FORMAT = '"S/" #,##0.00';
const DATE_FORMAT = 'dd/mm/yyyy';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
  ) {}

  private async toBuffer(
    sheetName: string,
    columns: SheetColumn[],
    rows: Record<string, unknown>[],
  ): Promise<Buffer> {
    const workbook = new Workbook();
    workbook.creator = 'Mirador Hotel Suite';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = columns.map((column) => ({
      header: column.header,
      key: column.key,
      width: column.width ?? 18,
      style: column.numFmt ? { numFmt: column.numFmt } : undefined,
    }));

    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7C5C3E' },
    };
    header.alignment = { vertical: 'middle' };

    sheet.addRows(rows);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async monthlyRevenue(year: number): Promise<Buffer> {
    const { months } = await this.analytics.getMonthlyRevenue(year);
    const rows = months.map((month) => ({
      month: MONTH_LABELS[month.month - 1],
      grossRevenue: month.grossRevenue,
      roomTotal: month.roomTotal,
      chargesTotal: month.chargesTotal,
      discountAmount: month.discountAmount,
      paymentsCount: month.paymentsCount,
    }));

    return this.toBuffer(
      `Ingresos ${year}`,
      [
        { header: 'Mes', key: 'month', width: 14 },
        { header: 'Ingreso bruto', key: 'grossRevenue', numFmt: PEN_FORMAT },
        { header: 'Habitaciones', key: 'roomTotal', numFmt: PEN_FORMAT },
        { header: 'Consumos', key: 'chargesTotal', numFmt: PEN_FORMAT },
        { header: 'Descuentos', key: 'discountAmount', numFmt: PEN_FORMAT },
        { header: 'N.º de pagos', key: 'paymentsCount', width: 14 },
      ],
      rows,
    );
  }

  async annualRevenue(): Promise<Buffer> {
    const rows = await this.analytics.getAnnualRevenue();

    return this.toBuffer(
      'Ingresos anuales',
      [
        { header: 'Año', key: 'year', width: 12 },
        { header: 'Ingreso bruto', key: 'grossRevenue', numFmt: PEN_FORMAT },
        { header: 'Habitaciones', key: 'roomTotal', numFmt: PEN_FORMAT },
        { header: 'Consumos', key: 'chargesTotal', numFmt: PEN_FORMAT },
        { header: 'Descuentos', key: 'discountAmount', numFmt: PEN_FORMAT },
        { header: 'N.º de pagos', key: 'paymentsCount', width: 14 },
      ],
      rows,
    );
  }

  async topRooms(): Promise<Buffer> {
    const rows = await this.analytics.getTopRooms();

    return this.toBuffer(
      'Habitaciones más usadas',
      [
        { header: 'Habitación', key: 'number', width: 14 },
        { header: 'Tipo', key: 'type', width: 16 },
        { header: 'Reservas', key: 'reservations', width: 14 },
        { header: 'Noches', key: 'nights', width: 14 },
      ],
      rows,
    );
  }

  async employeeRanking(): Promise<Buffer> {
    const rows = (await this.analytics.getEmployeeRanking()).map((row) => ({
      employee:
        [row.firstName, row.lastName].filter(Boolean).join(' ') ||
        `Empleado #${row.employeeId}`,
      charges: row.charges,
      chargesTotal: row.chargesTotal,
    }));

    return this.toBuffer(
      'Empleados destacados',
      [
        { header: 'Empleado', key: 'employee', width: 28 },
        { header: 'Cargos registrados', key: 'charges', width: 18 },
        { header: 'Monto total', key: 'chargesTotal', numFmt: PEN_FORMAT },
      ],
      rows,
    );
  }

  async occupancy(year: number): Promise<Buffer> {
    const { months } = await this.analytics.getOccupancy(year);
    const rows = months.map((month) => ({
      month: MONTH_LABELS[month.month - 1],
      reservations: month.reservations,
    }));

    return this.toBuffer(
      `Ocupación ${year}`,
      [
        { header: 'Mes', key: 'month', width: 14 },
        { header: 'Reservas', key: 'reservations', width: 14 },
      ],
      rows,
    );
  }

  async reservations(): Promise<Buffer> {
    const reservations = await this.prisma.reservation.findMany({
      orderBy: [{ checkIn: 'desc' }, { id: 'desc' }],
      include: {
        room: { select: { number: true, type: { select: { name: true } } } },
        status: { select: { name: true } },
        guest: { select: { fullName: true, nationalId: true } },
        payment: {
          select: {
            grandTotal: true,
            paymentMethod: { select: { name: true } },
          },
        },
      },
    });

    const rows = reservations.map((reservation) => ({
      id: reservation.id,
      guest: reservation.guest.fullName,
      nationalId: reservation.guest.nationalId,
      room: reservation.room.number,
      type: reservation.room.type?.name ?? null,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      status: reservation.status?.name ?? null,
      grandTotal: reservation.payment
        ? Number(reservation.payment.grandTotal)
        : null,
      paymentMethod: reservation.payment?.paymentMethod?.name ?? null,
    }));

    return this.toBuffer(
      'Reservas',
      [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Huésped', key: 'guest', width: 28 },
        { header: 'DNI', key: 'nationalId', width: 14 },
        { header: 'Habitación', key: 'room', width: 12 },
        { header: 'Tipo', key: 'type', width: 14 },
        { header: 'Check-in', key: 'checkIn', width: 14, numFmt: DATE_FORMAT },
        { header: 'Check-out', key: 'checkOut', width: 14, numFmt: DATE_FORMAT },
        { header: 'Estado', key: 'status', width: 14 },
        { header: 'Total pagado', key: 'grandTotal', numFmt: PEN_FORMAT },
        { header: 'Método de pago', key: 'paymentMethod', width: 16 },
      ],
      rows,
    );
  }

  async guests(): Promise<Buffer> {
    const guests = await this.prisma.guest.findMany({
      orderBy: [{ registeredAt: 'desc' }, { id: 'desc' }],
      include: { _count: { select: { reservations: true } } },
    });

    const rows = guests.map((guest) => ({
      id: guest.id,
      fullName: guest.fullName,
      nationalId: guest.nationalId,
      email: guest.email,
      phone: guest.phone,
      registeredAt: guest.registeredAt,
      reservations: guest._count.reservations,
    }));

    return this.toBuffer(
      'Huéspedes',
      [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Nombre', key: 'fullName', width: 28 },
        { header: 'DNI', key: 'nationalId', width: 14 },
        { header: 'Email', key: 'email', width: 26 },
        { header: 'Teléfono', key: 'phone', width: 16 },
        {
          header: 'Registrado',
          key: 'registeredAt',
          width: 14,
          numFmt: DATE_FORMAT,
        },
        { header: 'N.º de reservas', key: 'reservations', width: 16 },
      ],
      rows,
    );
  }
}
