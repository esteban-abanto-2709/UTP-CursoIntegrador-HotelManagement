import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { FilterAuditLogsDto } from './dto/filter-audit-logs.dto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    employeeId: number,
    action: string,
    tableName: string,
    recordId: number,
    prev?: object,
    next?: object,
  ) {
    const auditAction = await this.prisma.auditAction.findUnique({
      where: { name: action },
    });

    if (!auditAction) return;

    await this.prisma.auditLog.create({
      data: {
        employeeId,
        actionId: auditAction.id,
        tableName,
        recordId,
        previousValue: prev ? JSON.stringify(prev) : null,
        newValue: next ? JSON.stringify(next) : null,
      },
    });
  }

  async findAll(filters: FilterAuditLogsDto) {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.tableName) {
      where.tableName = filters.tableName;
    }
    if (filters.employeeId) {
      where.employeeId = Number(filters.employeeId);
    }
    if (filters.from || filters.to) {
      where.performedAt = {};
      if (filters.from) where.performedAt.gte = new Date(filters.from);
      if (filters.to) where.performedAt.lte = new Date(filters.to);
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        action: { select: { name: true } },
      },
      orderBy: { performedAt: 'desc' },
    });

    return logs.map((log) => ({
      ...log,
      previousValue: this.parseValue(log.previousValue),
      newValue: this.parseValue(log.newValue),
    }));
  }

  private parseValue(value: string | null): unknown {
    if (value === null) return null;
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }
}
