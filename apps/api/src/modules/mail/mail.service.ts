import 'dotenv/config';
import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { PdfService } from '../pdf/pdf.service';
import { buildVoucherHtml, type VoucherData } from '../pdf/templates/voucher.template';

export interface SendVoucherOptions {
  to: string;
  subject: string;
  text: string;
  voucher: VoucherData;
  filename?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from = process.env.MAIL_FROM ?? 'Mirador <no-reply@mirador.test>';

  constructor(private readonly pdf: PdfService) {
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
    const pdf = await this.pdf.render(buildVoucherHtml(opts.voucher));
    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      attachments: [{ filename: opts.filename ?? 'voucher.pdf', content: pdf }],
    });
    this.logger.log(`Correo enviado a ${opts.to} (${opts.voucher.code})`);
  }
}
