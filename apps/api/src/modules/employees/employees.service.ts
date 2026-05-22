import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateEmployeeDto, Cargo } from './dto/create-employee.dto';
import * as bcrypt from 'bcrypt';

const CARGO_TO_ROLE: Record<Cargo, Role> = {
  Manager: Role.MANAGER,
  Recepcionista: Role.EMPLOYEE,
  Botones: Role.EMPLOYEE,
  Limpieza: Role.EMPLOYEE,
};

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.employee.findUnique({ where: { username } });
  }

  async create(data: CreateEmployeeDto, currentUser: any) {
    const targetRole = CARGO_TO_ROLE[data.cargo];

    if (currentUser.role === 'MANAGER' && targetRole !== Role.EMPLOYEE) {
      throw new ConflictException('Los Managers solo pueden crear Empleados');
    }

    const existing = await this.prisma.employee.findFirst({
      where: {
        OR: [
          { username: data.username },
          { dni: data.dni },
          { email: data.email },
        ],
      },
    });

    if (existing?.username === data.username) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }
    if (existing?.dni === data.dni) {
      throw new ConflictException('El DNI ya está registrado');
    }
    if (existing?.email === data.email) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const employee = await this.prisma.employee.create({
      data: {
        username: data.username,
        password: hashedPassword,
        role: targetRole,
        dni: data.dni,
        nombres: data.nombres,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno,
        fechaNacimiento: new Date(data.fechaNacimiento),
        cargo: data.cargo,
        turno: data.turno,
        fechaInicio: new Date(data.fechaInicio),
        telefono: data.telefono,
        email: data.email,
        direccion: data.direccion,
      },
    });

    const { password, ...result } = employee;
    return result;
  }

  async findAll(currentUser: any) {
    const where =
      currentUser.role === 'MANAGER' ? { role: { not: Role.OWNER } } : {};

    return this.prisma.employee.findMany({
      where,
      select: {
        id: true,
        username: true,
        role: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        cargo: true,
        turno: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
