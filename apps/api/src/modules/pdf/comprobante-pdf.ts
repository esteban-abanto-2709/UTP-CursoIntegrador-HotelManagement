import PDFDocument from 'pdfkit';
import {
  EMPRESA,
  PAYMENT_LABELS,
  calcNights,
  formatCorrelativo,
  formatDate,
  formatHora,
  getRoomTypeLabel,
  igvBreakdown,
  money,
  numeroALetras,
} from './format';

export interface ComprobanteData {
  paymentId: number;
  processedAt: string | Date;
  paymentMethod: string;
  guest: { nationalId: string; fullName: string; email: string | null; phone: string | null };
  checkIn: string | Date;
  checkOut: string | Date;
  room: { number: string; type: string };
  rateSnapshot: number;
  roomTotal: number;
  subtotal: number;
  grandTotal: number;
  employee: { firstName: string; lastName: string };
  discounts: { name: string; percentage: number; amount: number }[];
  charges: { description: string; amount: number; category: string }[];
}

interface TotOpts {
  bold?: boolean;
  big?: boolean;
  color?: string;
}

export function buildComprobantePdf(data: ComprobanteData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const M = 50;
    const right = doc.page.width - M;
    const tipo = getRoomTypeLabel(data.room.type);
    const nights = calcNights(data.checkIn, data.checkOut);
    const { base, igv } = igvBreakdown(data.grandTotal);
    const metodoPago =
      PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod ?? '-';
    const contacto = data.guest.phone ?? data.guest.email ?? '-';

    // ── Encabezado (izquierda) ──
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#000').text(EMPRESA.nombreComercial, M, M);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#555')
      .text(EMPRESA.razonSocial)
      .text(EMPRESA.direccion)
      .text(EMPRESA.ciudad)
      .text(`Tel. ${EMPRESA.telefono} · ${EMPRESA.email}`);

    // ── Encabezado (caja derecha) ──
    const boxW = 190;
    const boxX = right - boxW;
    doc.roundedRect(boxX, M, boxW, 74, 4).stroke('#999');
    doc
      .fillColor('#555')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(`R.U.C. ${EMPRESA.ruc}`, boxX, M + 9, { width: boxW, align: 'center' });
    doc
      .fillColor('#000')
      .fontSize(12)
      .text('BOLETA DE VENTA', boxX, M + 24, { width: boxW, align: 'center' });
    doc
      .fontSize(11)
      .text(formatCorrelativo(data.paymentId), boxX, M + 40, { width: boxW, align: 'center' });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#555')
      .text(`Método: ${metodoPago}`, boxX, M + 57, { width: boxW, align: 'center' });

    // ── Datos del huésped ──
    let y = 140;
    doc.moveTo(M, y).lineTo(right, y).strokeColor('#ccc').stroke();
    y += 12;

    const colGap = 20;
    const colW = (right - M - colGap) / 2;
    const c1 = M;
    const c2 = M + colW + colGap;
    const field = (x: number, yy: number, label: string, value: string) => {
      doc.font('Helvetica').fontSize(8).fillColor('#888').text(label.toUpperCase(), x, yy, { width: colW });
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#000').text(value, x, yy + 10, { width: colW });
    };
    field(c1, y, 'Señor(es)', data.guest.fullName);
    field(c2, y, 'DNI', data.guest.nationalId);
    y += 34;
    field(c1, y, 'Contacto', contacto);
    field(c2, y, 'Fecha de emisión', `${formatDate(data.processedAt)} ${formatHora(data.processedAt)}`);
    y += 34;
    field(c1, y, 'Habitación', `${data.room.number} — ${tipo}`);
    field(
      c2,
      y,
      'Check-in / Check-out',
      `${formatDate(data.checkIn)} - ${formatDate(data.checkOut)} (${nights} noche${nights > 1 ? 's' : ''})`,
    );
    y += 44;

    // ── Tabla de items ──
    doc.moveTo(M, y).lineTo(right, y).strokeColor('#ccc').stroke();
    y += 6;
    doc.font('Helvetica').fontSize(8).fillColor('#888');
    doc.text('DESCRIPCIÓN', M, y, { width: 245 });
    doc.text('CANT.', 300, y, { width: 45, align: 'center' });
    doc.text('P. UNIT.', 385, y, { width: 60, align: 'right' });
    doc.text('IMPORTE', 475, y, { width: 70, align: 'right' });
    y += 14;
    doc.moveTo(M, y).lineTo(right, y).strokeColor('#ccc').stroke();
    y += 8;

    const rows = [
      {
        d: `Hospedaje — ${tipo} (tarifa por noche)`,
        c: nights,
        u: data.rateSnapshot,
        imp: data.roomTotal,
      },
      ...data.charges.map((ch) => ({
        d: `${ch.category} — ${ch.description}`,
        c: 1,
        u: ch.amount,
        imp: ch.amount,
      })),
    ];

    doc.font('Helvetica').fontSize(10).fillColor('#000');
    for (const r of rows) {
      const h = doc.heightOfString(r.d, { width: 245 });
      doc.text(r.d, M, y, { width: 245 });
      doc.text(String(r.c), 300, y, { width: 45, align: 'center' });
      doc.text(r.u.toFixed(2), 385, y, { width: 60, align: 'right' });
      doc.text(r.imp.toFixed(2), 475, y, { width: 70, align: 'right' });
      y += Math.max(h, 14) + 4;
    }
    y += 8;

    // ── Totales (bloque derecho) ──
    const totX = right - 240;
    const totLabelW = 150;
    const totValW = 90;
    const totLine = (label: string, value: string, opts: TotOpts = {}) => {
      doc
        .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(opts.big ? 13 : 10)
        .fillColor(opts.color ?? '#000');
      doc.text(label, totX, y, { width: totLabelW });
      doc.text(value, totX + totLabelW, y, { width: totValW, align: 'right' });
      y += opts.big ? 20 : 15;
    };
    totLine('Op. Gravada (Base imponible)', money(base));
    totLine('I.G.V. (18%)', money(igv));
    totLine('Subtotal estadía', money(data.subtotal));
    for (const d of data.discounts) {
      totLine(`Descuento — ${d.name} (${d.percentage.toFixed(0)}%)`, `- ${money(d.amount)}`, {
        color: '#c00',
      });
    }
    y += 2;
    doc.moveTo(totX, y).lineTo(right, y).strokeColor('#000').stroke();
    y += 6;
    totLine('TOTAL A PAGAR', money(data.grandTotal), { bold: true, big: true });

    // ── Pie ──
    y += 8;
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#333')
      .text(`Son: ${numeroALetras(data.grandTotal)}`, M, y, { width: right - M });
    y = doc.y + 16;
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#333')
      .text(`Atendido por: ${data.employee.firstName} ${data.employee.lastName}`, M, y, {
        width: right - M,
      });
    doc
      .fillColor('#888')
      .fontSize(8)
      .text(
        'Documento interno de control. No constituye comprobante de pago electrónico para efectos tributarios (SUNAT).',
      )
      .text(`Gracias por su preferencia — ${EMPRESA.nombreComercial}.`);

    doc.end();
  });
}
