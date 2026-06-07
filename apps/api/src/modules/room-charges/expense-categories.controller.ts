import { Controller, Get, UseGuards } from '@nestjs/common';
import { RoomChargesService } from './room-charges.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('expense-categories')
@UseGuards(JwtAuthGuard)
export class ExpenseCategoriesController {
  constructor(private readonly roomChargesService: RoomChargesService) {}

  @Get()
  findAll() {
    return this.roomChargesService.findAllCategories();
  }
}
