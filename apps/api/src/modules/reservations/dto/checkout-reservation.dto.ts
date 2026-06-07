import { IsEnum, IsOptional, IsInt } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CheckoutReservationDto {
  @IsEnum(PaymentMethod, {
    message: 'El método de pago debe ser CASH, CARD o TRANSFER',
  })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsInt({ message: 'discountId debe ser un número entero' })
  discountId?: number;
}
