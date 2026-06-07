import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { FindDiscountsDto } from './dto/find-discounts.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('discounts')
@UseGuards(JwtAuthGuard)
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get()
  findAll(@Query() filters: FindDiscountsDto) {
    return this.discountsService.findAll(filters);
  }
}
