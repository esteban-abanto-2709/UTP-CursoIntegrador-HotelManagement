import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomStatusDto } from './dto/update-room-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'MANAGER')
  @Post()
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomStatusDto: UpdateRoomStatusDto,
  ) {
    return this.roomsService.updateStatus(id, updateRoomStatusDto);
  }
}
