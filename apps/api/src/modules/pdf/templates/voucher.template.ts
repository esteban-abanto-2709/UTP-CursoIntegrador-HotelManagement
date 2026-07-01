import { EMPRESA, esc, money } from './format';

export interface VoucherData {
  code: string;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
}

export function buildVoucherHtml(data: VoucherData): string {
  const row = (label: string, value: string) =>
    `<div class="row"><span class="lbl">${esc(label)}</span><span class="val">${esc(value)}</span></div>`;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Voucher ${esc(data.code)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 20mm; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #18181b; font-size: 13px; }
  .head { border-bottom: 2px solid #27272a; padding-bottom: 16px; }
  .brand { font-size: 26px; font-weight: 700; letter-spacing: -0.3px; }
  .razon { margin-top: 2px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #52525b; }
  .muted { color: #71717a; font-size: 11px; margin-top: 6px; }
  .title { margin-top: 26px; font-size: 18px; font-weight: 700; }
  .code { color: #71717a; font-weight: 600; }
  .card { margin-top: 18px; border: 1px solid #e4e4e7; border-radius: 10px; padding: 18px 22px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f4f4f5; }
  .row:last-child { border-bottom: 0; }
  .lbl { color: #71717a; }
  .val { font-weight: 600; }
  .total { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; border-top: 2px solid #27272a; padding-top: 12px; }
  .total .t-lbl { font-size: 14px; font-weight: 700; text-transform: uppercase; }
  .total .t-val { font-size: 20px; font-weight: 700; }
  .foot { margin-top: 26px; font-size: 11px; color: #71717a; }
</style>
</head>
<body>
  <div class="head">
    <div class="brand">${esc(EMPRESA.nombreComercial)}</div>
    <div class="razon">${esc(EMPRESA.razonSocial)}</div>
    <div class="muted">${esc(EMPRESA.direccion)} · ${esc(EMPRESA.ciudad)}</div>
    <div class="muted">Tel. ${esc(EMPRESA.telefono)} · ${esc(EMPRESA.email)}</div>
  </div>

  <div class="title">Voucher de reserva <span class="code">· ${esc(data.code)}</span></div>

  <div class="card">
    ${row('Huésped', data.guestName)}
    ${row('Habitación', data.roomNumber)}
    ${row('Check-in', data.checkIn)}
    ${row('Check-out', data.checkOut)}
    ${row('Noches', String(data.nights))}
  </div>

  <div class="total">
    <span class="t-lbl">Total</span>
    <span class="t-val">${money(data.total)}</span>
  </div>

  <div class="foot">Gracias por su preferencia — ${esc(EMPRESA.nombreComercial)}.</div>
</body>
</html>`;
}
