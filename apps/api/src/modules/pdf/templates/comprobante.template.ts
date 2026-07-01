import {
  EMPRESA,
  PAYMENT_LABELS,
  calcNights,
  esc,
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

export function buildComprobanteHtml(data: ComprobanteData): string {
  const tipo = getRoomTypeLabel(data.room.type);
  const nights = calcNights(data.checkIn, data.checkOut);
  const { base, igv } = igvBreakdown(data.grandTotal);
  const metodoPago = PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod ?? '—';
  const contacto = data.guest.phone ?? data.guest.email ?? '—';

  const itemRows = [
    `<tr><td>Hospedaje — ${esc(tipo)} (tarifa por noche)</td><td class="c">${nights}</td><td class="r">${data.rateSnapshot.toFixed(2)}</td><td class="r">${data.roomTotal.toFixed(2)}</td></tr>`,
    ...data.charges.map(
      (charge) =>
        `<tr><td>${esc(charge.category)} — ${esc(charge.description)}</td><td class="c">1</td><td class="r">${charge.amount.toFixed(2)}</td><td class="r">${charge.amount.toFixed(2)}</td></tr>`,
    ),
  ].join('');

  const discountRows = data.discounts
    .map(
      (d) =>
        `<div class="tline"><span>Descuento — ${esc(d.name)} (${d.percentage.toFixed(0)}%)</span><span class="neg">− ${money(d.amount)}</span></div>`,
    )
    .join('');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Comprobante ${esc(formatCorrelativo(data.paymentId))}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 16mm; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #18181b; font-size: 12px; line-height: 1.4; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #d4d4d8; padding-bottom: 16px; }
  .brand { font-size: 24px; font-weight: 700; letter-spacing: -0.3px; }
  .razon { margin-top: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #52525b; }
  .muted { color: #52525b; font-size: 11px; }
  .box { width: 230px; border: 1px solid #a1a1aa; border-radius: 6px; padding: 10px 14px; text-align: center; }
  .box .ruc { font-size: 11px; font-weight: 600; color: #52525b; }
  .box .ttl { margin-top: 4px; font-size: 13px; font-weight: 700; text-transform: uppercase; }
  .box .folio { margin-top: 4px; font-size: 13px; font-weight: 600; }
  .box .pay { margin-top: 8px; border-top: 1px solid #e4e4e7; padding-top: 6px; }
  .box .pay span { font-size: 11px; font-weight: 600; color: #52525b; }
  .box .pay b { display: block; font-size: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 18px 0; }
  .grid .lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #71717a; }
  .grid .val { font-size: 13px; font-weight: 600; }
  .grid .val.thin { font-weight: 400; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th { border-top: 1px solid #d4d4d8; border-bottom: 1px solid #d4d4d8; padding: 8px 0; text-align: left; text-transform: uppercase; font-size: 10px; color: #71717a; }
  tbody td { padding: 8px 0; border-bottom: 1px solid #f4f4f5; }
  th.c, td.c { text-align: center; }
  th.r, td.r { text-align: right; }
  .totals { display: flex; justify-content: flex-end; margin-top: 18px; }
  .totals .inner { width: 280px; }
  .tline { display: flex; justify-content: space-between; padding: 4px 0; }
  .tline span:first-child { color: #52525b; }
  .tline.sep { border-top: 1px solid #e4e4e7; }
  .neg { color: #dc2626; }
  .grand { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; border-top: 2px solid #27272a; padding-top: 8px; }
  .grand .g-lbl { font-size: 13px; font-weight: 700; text-transform: uppercase; }
  .grand .g-val { font-size: 18px; font-weight: 700; }
  .son { margin-top: 18px; border-top: 1px solid #e4e4e7; padding-top: 14px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #3f3f46; }
  .foot { margin-top: 22px; font-size: 11px; color: #71717a; }
  .foot .by { color: #3f3f46; }
  .foot p { margin-top: 2px; }
</style>
</head>
<body>
  <div class="head">
    <div>
      <div class="brand">${esc(EMPRESA.nombreComercial)}</div>
      <div class="razon">${esc(EMPRESA.razonSocial)}</div>
      <div class="muted" style="margin-top:8px;">${esc(EMPRESA.direccion)}</div>
      <div class="muted">${esc(EMPRESA.ciudad)}</div>
      <div class="muted">Tel. ${esc(EMPRESA.telefono)} · ${esc(EMPRESA.email)}</div>
    </div>
    <div class="box">
      <div class="ruc">R.U.C. ${esc(EMPRESA.ruc)}</div>
      <div class="ttl">Boleta de Venta</div>
      <div class="folio">${esc(formatCorrelativo(data.paymentId))}</div>
      <div class="pay"><span>Método de pago</span><b>${esc(metodoPago)}</b></div>
    </div>
  </div>

  <div class="grid">
    <div><div class="lbl">Señor(es)</div><div class="val">${esc(data.guest.fullName)}</div></div>
    <div><div class="lbl">DNI</div><div class="val">${esc(data.guest.nationalId)}</div></div>
    <div><div class="lbl">Contacto</div><div class="val thin">${esc(contacto)}</div></div>
    <div><div class="lbl">Fecha de emisión</div><div class="val thin">${esc(formatDate(data.processedAt))} ${esc(formatHora(data.processedAt))}</div></div>
    <div><div class="lbl">Habitación</div><div class="val">${esc(data.room.number)} — ${esc(tipo)}</div></div>
    <div><div class="lbl">Check-in / Check-out</div><div class="val thin">${esc(formatDate(data.checkIn))} ${esc(formatDate(data.checkOut))} (${nights} noche${nights > 1 ? 's' : ''})</div></div>
  </div>

  <table>
    <thead><tr><th>Descripción</th><th class="c">Cant.</th><th class="r">P. Unit.</th><th class="r">Importe</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div class="inner">
      <div class="tline"><span>Op. Gravada (Base imponible)</span><span>${money(base)}</span></div>
      <div class="tline"><span>I.G.V. (18%)</span><span>${money(igv)}</span></div>
      <div class="tline sep"><span>Subtotal estadía</span><span>${money(data.subtotal)}</span></div>
      ${discountRows}
      <div class="grand"><span class="g-lbl">Total a pagar</span><span class="g-val">${money(data.grandTotal)}</span></div>
    </div>
  </div>

  <div class="son">Son: ${esc(numeroALetras(data.grandTotal))}</div>

  <div class="foot">
    <div class="by">Atendido por: ${esc(data.employee.firstName)} ${esc(data.employee.lastName)}</div>
    <p>Documento interno de control. No constituye comprobante de pago electrónico para efectos tributarios (SUNAT).</p>
    <p>Gracias por su preferencia — ${esc(EMPRESA.nombreComercial)}.</p>
  </div>
</body>
</html>`;
}
