import { Controller, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue/monthly')
  getMonthlyRevenue(
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ) {
    return this.analyticsService.getMonthlyRevenue(year ?? new Date().getFullYear());
  }

  @Get('revenue/annual')
  getAnnualRevenue() {
    return this.analyticsService.getAnnualRevenue();
  }
}
