import { IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CheckoutReservationDto {
  @IsEnum(PaymentMethod, {
    message: 'El método de pago debe ser CASH, CARD o TRANSFER',
  })
  paymentMethod: PaymentMethod;
}
