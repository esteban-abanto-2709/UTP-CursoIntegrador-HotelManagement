import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';

// ponytail: endpoint temporal de prueba del paso 1. Sin guard para poder
// dispararlo fácil desde el .http. Borrar al cablear a checkout/reserva.
@Controller('mail')
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Post('test')
  async test(@Body('to') to?: string) {
    const destino = to ?? 'huesped@example.com';
    await this.mail.sendVoucher({
      to: destino,
      subject: 'Prueba · Voucher de reserva Mirador',
      text: 'Adjuntamos tu voucher de reserva (correo de prueba).',
      voucher: {
        code: 'RSV-DEMO-001',
        guestName: 'Juan Pérez',
        roomNumber: '101',
        checkIn: '2026-07-10',
        checkOut: '2026-07-13',
        nights: 3,
        total: 450,
      },
    });
    return { ok: true, sentTo: destino };
  }
}
