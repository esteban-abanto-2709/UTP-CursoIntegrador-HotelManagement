import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private send(res: Response, filename: string, buffer: Buffer) {
    res.set({
      'Content-Type': XLSX_MIME,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get('revenue/monthly')
  async monthlyRevenue(
    @Res() res: Response,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ) {
    const period = year ?? new Date().getFullYear();
    const buffer = await this.reportsService.monthlyRevenue(period);
    this.send(res, `ingresos-mensuales-${period}.xlsx`, buffer);
  }

  @Get('revenue/annual')
  async annualRevenue(@Res() res: Response) {
    const buffer = await this.reportsService.annualRevenue();
    this.send(res, 'ingresos-anuales.xlsx', buffer);
  }

  @Get('top-rooms')
  async topRooms(@Res() res: Response) {
    const buffer = await this.reportsService.topRooms();
    this.send(res, 'habitaciones-mas-usadas.xlsx', buffer);
  }

  @Get('employee-ranking')
  async employeeRanking(@Res() res: Response) {
    const buffer = await this.reportsService.employeeRanking();
    this.send(res, 'empleados-destacados.xlsx', buffer);
  }

  @Get('occupancy')
  async occupancy(
    @Res() res: Response,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ) {
    const period = year ?? new Date().getFullYear();
    const buffer = await this.reportsService.occupancy(period);
    this.send(res, `ocupacion-${period}.xlsx`, buffer);
  }

  @Get('reservations')
  async reservations(@Res() res: Response) {
    const buffer = await this.reportsService.reservations();
    this.send(res, 'reservas.xlsx', buffer);
  }

  @Get('guests')
  async guests(@Res() res: Response) {
    const buffer = await this.reportsService.guests();
    this.send(res, 'huespedes.xlsx', buffer);
  }
}
