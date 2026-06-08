import { IsIn, IsOptional, IsInt } from 'class-validator';

export const VALID_PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER'] as const;

export type PaymentMethodName = (typeof VALID_PAYMENT_METHODS)[number];

export class CheckoutReservationDto {
  @IsIn(VALID_PAYMENT_METHODS, {
    message: 'El método de pago debe ser CASH, CARD o TRANSFER',
  })
  paymentMethod: PaymentMethodName;

  @IsOptional()
  @IsInt({ message: 'discountId debe ser un número entero' })
  discountId?: number;
}
