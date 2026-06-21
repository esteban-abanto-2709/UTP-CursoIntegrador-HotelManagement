import { IsIn, IsOptional, IsInt, IsArray } from 'class-validator';

export const VALID_PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER'] as const;

export type PaymentMethodName = (typeof VALID_PAYMENT_METHODS)[number];

export class CheckoutReservationDto {
  @IsIn(VALID_PAYMENT_METHODS, {
    message: 'El método de pago debe ser CASH, CARD o TRANSFER',
  })
  paymentMethod: PaymentMethodName;

  @IsOptional()
  @IsArray({ message: 'discountIds debe ser un arreglo' })
  @IsInt({ each: true, message: 'cada discountId debe ser un número entero' })
  discountIds?: number[];
}
