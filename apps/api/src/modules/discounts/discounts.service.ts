import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { FindDiscountsDto } from './dto/find-discounts.dto';

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}

  findAll(filters: FindDiscountsDto) {
    return this.prisma.discount.findMany({
      where: filters.active === 'true' ? { isActive: true } : {},
      orderBy: { name: 'asc' },
    });
  }
}
