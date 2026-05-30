import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateEmployeeDto, Cargo } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
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

  async findOne(id: number, currentUser: any) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      throw new NotFoundException(`No existe un empleado con el ID ${id}`);
    }

    // Un MANAGER solo puede consultar el detalle de EMPLEADOS
    if (currentUser.role === 'MANAGER' && employee.role !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'No tienes permisos para ver a este usuario',
      );
    }

    const { password, ...result } = employee;
    return result;
  }

  async update(id: number, data: UpdateEmployeeDto, currentUser: any) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      throw new NotFoundException(`No existe un empleado con el ID ${id}`);
    }

    // Un MANAGER no puede editar cuentas OWNER ni a otros MANAGER
    if (
      currentUser.role === 'MANAGER' &&
      employee.role !== Role.EMPLOYEE
    ) {
      throw new ForbiddenException(
        'No tienes permisos para editar a este usuario',
      );
    }

    // Si cambia el cargo, recalculamos el rol; si no, mantenemos el actual
    const targetRole = data.cargo ? CARGO_TO_ROLE[data.cargo] : employee.role;

    if (currentUser.role === 'MANAGER' && targetRole !== Role.EMPLOYEE) {
      throw new ConflictException('Los Managers solo pueden asignar Empleados');
    }

    // Validar unicidad solo de los campos que cambian, excluyendo al propio empleado
    const conflicts: { username?: string; dni?: string; email?: string } = {};
    if (data.username && data.username !== employee.username)
      conflicts.username = data.username;
    if (data.dni && data.dni !== employee.dni) conflicts.dni = data.dni;
    if (data.email && data.email !== employee.email)
      conflicts.email = data.email;

    if (Object.keys(conflicts).length > 0) {
      const existing = await this.prisma.employee.findFirst({
        where: {
          id: { not: id },
          OR: Object.entries(conflicts).map(([key, value]) => ({
            [key]: value,
          })),
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
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        username: data.username,
        role: data.cargo ? targetRole : undefined,
        dni: data.dni,
        nombres: data.nombres,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno,
        fechaNacimiento: data.fechaNacimiento
          ? new Date(data.fechaNacimiento)
          : undefined,
        cargo: data.cargo,
        turno: data.turno,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
        telefono: data.telefono,
        email: data.email,
        direccion: data.direccion,
        // Solo re-hashea si se envió una nueva contraseña
        password: data.password
          ? await bcrypt.hash(data.password, 10)
          : undefined,
      },
    });

    const { password, ...result } = updated;
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
