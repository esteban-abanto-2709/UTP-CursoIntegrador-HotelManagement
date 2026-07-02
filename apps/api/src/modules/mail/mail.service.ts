import 'dotenv/config';
import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { buildVoucherPdf, type VoucherData } from '../pdf/voucher-pdf';
import { EMPRESA } from '../pdf/format';

export interface SendVoucherOptions {
  to: string;
  subject: string;
  text: string;
  voucher: VoucherData;
  filename?: string;
}

export interface SendReceiptOptions {
  to: string;
  guestName: string;
  filename: string;
  pdf: Buffer;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from = process.env.MAIL_FROM ?? 'Mirador <no-reply@mirador.test>';

  constructor() {
    this.transporter = createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT ?? 2525),
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendVoucher(opts: SendVoucherOptions): Promise<void> {
    const pdf = await buildVoucherPdf(opts.voucher);
    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      attachments: [{ filename: opts.filename ?? 'voucher.pdf', content: pdf }],
    });
    this.logger.log(`Correo enviado a ${opts.to} (${opts.voucher.code})`);
  }

  async sendReceipt(opts: SendReceiptOptions): Promise<void> {
    const nombre = opts.guestName.split(' ')[0] || opts.guestName;
    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject: `Gracias por su estadía — ${EMPRESA.nombreComercial}`,
      text:
        `Estimado(a) ${nombre}:\n\n` +
        `Gracias por confiar en ${EMPRESA.nombreComercial}. Fue un gusto atenderle.\n\n` +
        `Adjuntamos el comprobante de su estadía en formato PDF.\n\n` +
        `Esperamos recibirle nuevamente muy pronto.\n\n` +
        `Un cordial saludo,\n${EMPRESA.nombreComercial}`,
      attachments: [{ filename: opts.filename, content: opts.pdf }],
    });
    this.logger.log(`Comprobante enviado a ${opts.to}`);
  }
}
