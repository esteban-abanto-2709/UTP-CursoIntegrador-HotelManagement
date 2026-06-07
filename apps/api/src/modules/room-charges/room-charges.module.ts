import { Module } from '@nestjs/common';
import { RoomChargesService } from './room-charges.service';
import { RoomChargesController } from './room-charges.controller';
import { ExpenseCategoriesController } from './expense-categories.controller';

@Module({
  providers: [RoomChargesService],
  controllers: [RoomChargesController, ExpenseCategoriesController],
  exports: [RoomChargesService],
})
export class RoomChargesModule {}
