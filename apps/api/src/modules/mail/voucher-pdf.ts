import PDFDocument from 'pdfkit';

export interface VoucherData {
  code: string;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
}

const HOTEL = {
  name: 'Mirador Hotel Suite',
  legal: 'MIRADOR HOTEL SUITE S.A.C.',
  email: 'recepcion@miradorhotel.pe',
};

const money = (n: number) => `S/ ${n.toFixed(2)}`;

export function buildVoucherPdf(data: VoucherData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(22).text(HOTEL.name, { align: 'left' });
    doc.fontSize(9).fillColor('gray').text(HOTEL.legal);
    doc.text(HOTEL.email);
    doc.moveDown();

    doc
      .fillColor('black')
      .fontSize(16)
      .text(`Voucher de reserva  ·  ${data.code}`);
    doc.moveDown();

    const line = (label: string, value: string) =>
      doc.fontSize(11).text(`${label}: ${value}`);

    doc.fillColor('black');
    line('Huésped', data.guestName);
    line('Habitación', data.roomNumber);
    line('Check-in', data.checkIn);
    line('Check-out', data.checkOut);
    line('Noches', String(data.nights));
    doc.moveDown();
    doc.fontSize(14).text(`Total: ${money(data.total)}`);

    doc.end();
  });
}
