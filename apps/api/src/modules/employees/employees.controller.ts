import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'MANAGER')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(
    @Body() dto: CreateEmployeeDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.employeesService.create(dto, currentUser);
  }

  @Get()
  findAll(@CurrentUser() currentUser: any) {
    return this.employeesService.findAll(currentUser);
  }
}
