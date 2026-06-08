import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { Employee, Role, Shift } from '@prisma/client';
import { CreateEmployeeDto, Cargo, Turno } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';

const CARGO_TO_ROLE: Record<Cargo, Role> = {
  Manager: Role.MANAGER,
  Recepcionista: Role.EMPLOYEE,
  Botones: Role.EMPLOYEE,
  Limpieza: Role.EMPLOYEE,
};

const TURNO_TO_SHIFT: Record<Turno, Shift> = {
  MAÑANA: Shift.MORNING,
  TARDE: Shift.AFTERNOON,
  NOCHE: Shift.NIGHT,
};

const SHIFT_TO_TURNO: Record<Shift, Turno> = {
  MORNING: 'MAÑANA',
  AFTERNOON: 'TARDE',
  NIGHT: 'NOCHE',
};

type EmployeeWithPosition = Employee & {
  jobPosition: { name: string } | null;
};

function toSpanishShape(employee: EmployeeWithPosition) {
  const {
    password,
    firstName,
    lastName,
    secondLastName,
    birthDate,
    positionId,
    jobPosition,
    shift,
    hireDate,
    phone,
    address,
    ...rest
  } = employee;
  return {
    ...rest,
    nombres: firstName,
    apellidoPaterno: lastName,
    apellidoMaterno: secondLastName,
    fechaNacimiento: birthDate,
    cargo: jobPosition?.name ?? null,
    turno: shift ? SHIFT_TO_TURNO[shift] : null,
    fechaInicio: hireDate,
    telefono: phone,
    direccion: address,
  };
}

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

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
        firstName: data.nombres,
        lastName: data.apellidoPaterno,
        secondLastName: data.apellidoMaterno,
        birthDate: new Date(data.fechaNacimiento),
        jobPosition: { connect: { name: data.cargo } },
        shift: TURNO_TO_SHIFT[data.turno],
        hireDate: new Date(data.fechaInicio),
        phone: data.telefono,
        email: data.email,
        address: data.direccion,
      },
      include: { jobPosition: true },
    });

    const result = toSpanishShape(employee);

    await this.audit.log(
      currentUser.id,
      'CREATE',
      'Employee',
      employee.id,
      undefined,
      result,
    );

    return result;
  }

  async findOne(id: number, currentUser: any) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { jobPosition: true },
    });

    if (!employee) {
      throw new NotFoundException(`No existe un empleado con el ID ${id}`);
    }

    if (currentUser.role === 'MANAGER' && employee.role !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'No tienes permisos para ver a este usuario',
      );
    }

    return toSpanishShape(employee);
  }

  async update(id: number, data: UpdateEmployeeDto, currentUser: any) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { jobPosition: true },
    });

    if (!employee) {
      throw new NotFoundException(`No existe un empleado con el ID ${id}`);
    }

    if (
      currentUser.role === 'MANAGER' &&
      employee.role !== Role.EMPLOYEE
    ) {
      throw new ForbiddenException(
        'No tienes permisos para editar a este usuario',
      );
    }

    const targetRole = data.cargo ? CARGO_TO_ROLE[data.cargo] : employee.role;

    if (currentUser.role === 'MANAGER' && targetRole !== Role.EMPLOYEE) {
      throw new ConflictException('Los Managers solo pueden asignar Empleados');
    }

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
        firstName: data.nombres,
        lastName: data.apellidoPaterno,
        secondLastName: data.apellidoMaterno,
        birthDate: data.fechaNacimiento
          ? new Date(data.fechaNacimiento)
          : undefined,
        jobPosition: data.cargo
          ? { connect: { name: data.cargo } }
          : undefined,
        shift: data.turno ? TURNO_TO_SHIFT[data.turno] : undefined,
        hireDate: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
        phone: data.telefono,
        email: data.email,
        address: data.direccion,
        password: data.password
          ? await bcrypt.hash(data.password, 10)
          : undefined,
      },
      include: { jobPosition: true },
    });

    const result = toSpanishShape(updated);

    await this.audit.log(
      currentUser.id,
      'UPDATE',
      'Employee',
      id,
      toSpanishShape(employee),
      result,
    );

    return result;
  }

  async findAll(currentUser: any) {
    const where =
      currentUser.role === 'MANAGER' ? { role: { not: Role.OWNER } } : {};

    const employees = await this.prisma.employee.findMany({
      where,
      select: {
        id: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        secondLastName: true,
        jobPosition: { select: { name: true } },
        shift: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return employees.map((e) => ({
      id: e.id,
      username: e.username,
      role: e.role,
      nombres: e.firstName,
      apellidoPaterno: e.lastName,
      apellidoMaterno: e.secondLastName,
      cargo: e.jobPosition?.name ?? null,
      turno: e.shift ? SHIFT_TO_TURNO[e.shift] : null,
      createdAt: e.createdAt,
    }));
  }
}
