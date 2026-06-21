import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/prisma/prisma.service';
import { FindDiscountsDto } from './dto/find-discounts.dto';

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: FindDiscountsDto) {
    const discounts = await this.prisma.discount.findMany({
      where: filters.active === 'true' ? { isActive: true } : {},
      orderBy: { name: 'asc' },
      include: { type: { select: { name: true } } },
    });

    return discounts.map(({ type, ...discount }) => ({
      ...discount,
      type: type.name,
    }));
  }
}
