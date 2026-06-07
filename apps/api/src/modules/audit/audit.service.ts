import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';

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
}
