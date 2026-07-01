export const EMPRESA = {
  nombreComercial: 'Mirador',
  razonSocial: 'MIRADOR HOTEL SUITE S.A.C.',
  ruc: '20603847156',
  direccion: 'Av. del Ejército N° 748, Miraflores',
  ciudad: 'Lima - Lima - Perú',
  telefono: '(01) 445-2210',
  email: 'recepcion@miradorhotel.pe',
  serie: 'B001',
} as const;

const IGV_RATE = 0.18;

export const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Sencilla',
  DOUBLE: 'Doble',
  SUITE: 'Suite',
};

export function getRoomTypeLabel(type: string): string {
  return ROOM_TYPE_LABELS[type] ?? type;
}

export function formatCorrelativo(paymentId: number): string {
  return `${EMPRESA.serie} - ${String(paymentId).padStart(7, '0')}`;
}

export function igvBreakdown(grandTotal: number): { base: number; igv: number } {
  const base = Math.round((grandTotal / (1 + IGV_RATE)) * 100) / 100;
  const igv = Math.round((grandTotal - base) * 100) / 100;
  return { base, igv };
}

export const money = (value: number) => `S/ ${value.toFixed(2)}`;

export function formatDate(value: string | Date): string {
  let y: number;
  let m: number;
  let d: number;

  if (typeof value === 'string') {
    const [yy, mm, dd] = value.split('T')[0].split('-').map(Number);
    y = yy;
    m = mm;
    d = dd;
  } else {
    y = value.getFullYear();
    m = value.getMonth() + 1;
    d = value.getDate();
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d)}/${pad(m)}/${y}`;
}

export function formatHora(value: string | Date): string {
  const dt = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export function calcNights(checkIn: string | Date, checkOut: string | Date) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diff =
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / MS_PER_DAY;
  return Math.max(1, Math.ceil(diff));
}

const UNIDADES = [
  '',
  'uno',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
  'diez',
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciseis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
  'veinte',
  'veintiuno',
  'veintidos',
  'veintitres',
  'veinticuatro',
  'veinticinco',
  'veintiseis',
  'veintisiete',
  'veintiocho',
  'veintinueve',
];

const DECENAS = [
  '',
  '',
  '',
  'treinta',
  'cuarenta',
  'cincuenta',
  'sesenta',
  'setenta',
  'ochenta',
  'noventa',
];

const CENTENAS = [
  '',
  'ciento',
  'doscientos',
  'trescientos',
  'cuatrocientos',
  'quinientos',
  'seiscientos',
  'setecientos',
  'ochocientos',
  'novecientos',
];

function seccion(n: number): string {
  if (n === 100) return 'cien';

  const centena = Math.floor(n / 100);
  const resto = n % 100;
  let texto = centena > 0 ? CENTENAS[centena] : '';

  if (resto > 0) {
    if (texto) texto += ' ';
    if (resto < 30) {
      texto += UNIDADES[resto];
    } else {
      const decena = Math.floor(resto / 10);
      const unidad = resto % 10;
      texto += DECENAS[decena];
      if (unidad > 0) texto += ` y ${UNIDADES[unidad]}`;
    }
  }

  return texto;
}

function enteroALetras(n: number): string {
  if (n === 0) return 'cero';

  const miles = Math.floor(n / 1000);
  const resto = n % 1000;
  let texto = '';

  if (miles > 0) {
    texto += miles === 1 ? 'mil' : `${seccion(miles)} mil`;
  }
  if (resto > 0) {
    if (texto) texto += ' ';
    texto += seccion(resto);
  }

  return texto;
}

export function numeroALetras(amount: number): string {
  const entero = Math.floor(amount + 1e-9);
  const centavos = Math.round((amount - entero) * 100);
  const palabras = enteroALetras(entero).toUpperCase();
  const cc = String(centavos).padStart(2, '0');
  return `${palabras} CON ${cc}/100 SOLES`;
}
