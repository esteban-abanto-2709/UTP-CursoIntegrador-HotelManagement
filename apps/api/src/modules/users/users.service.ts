import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async createUser(data: CreateUserDto, currentUser: any) {
    // === LÓGICA DE ROLES ESTRICTA ===
    if (currentUser.role === 'MANAGER' && data.role !== 'EMPLOYEE') {
      throw new ConflictException('Los Managers solo pueden crear Empleados');
    }

    if (currentUser.role === 'OWNER' && data.role === 'OWNER') {
      throw new ConflictException(
        'Solo puede existir un Owner o deben crearse por base de datos directamente',
      );
    }

    // 1. Verificar si el usuario ya existe
    const existingUser = await this.findByUsername(data.username);
    if (existingUser) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    // 2. Encriptar la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // 3. Guardar en la base de datos
    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        role: data.role,
      },
    });

    // 4. Retornar el usuario sin la contraseña por seguridad
    const { password, ...result } = user;
    return result;
  }
}
