import PDFDocument from 'pdfkit';
import { EMPRESA, money } from './format';

export interface VoucherData {
  code: string;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
}

export function buildVoucherPdf(data: VoucherData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(24).text(EMPRESA.nombreComercial);
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#555')
      .text(EMPRESA.razonSocial)
      .text(`${EMPRESA.direccion} · ${EMPRESA.ciudad}`)
      .text(`Tel. ${EMPRESA.telefono} · ${EMPRESA.email}`);

    doc.moveDown(1.5);
    doc
      .fillColor('#000')
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(`Voucher de reserva  ·  ${data.code}`);
    doc.moveDown();

    const line = (label: string, value: string) => {
      doc.font('Helvetica').fontSize(11).fillColor('#555').text(`${label}: `, {
        continued: true,
      });
      doc.font('Helvetica-Bold').fillColor('#000').text(value);
    };

    line('Huésped', data.guestName);
    line('Habitación', data.roomNumber);
    line('Check-in', data.checkIn);
    line('Check-out', data.checkOut);
    line('Noches', String(data.nights));

    doc.moveDown();
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(`Total: ${money(data.total)}`);

    doc.moveDown(2);
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#777')
      .text(`Gracias por su preferencia — ${EMPRESA.nombreComercial}.`);

    doc.end();
  });
}
