import { buildComprobantePdf, type ComprobanteData } from './comprobante-pdf';

const base: ComprobanteData = {
  paymentId: 42,
  processedAt: '2026-07-01T14:30:00.000Z',
  paymentMethod: 'CASH',
  guest: { nationalId: '12345678', fullName: 'Juan Pérez', email: null, phone: '999' },
  checkIn: '2026-07-10',
  checkOut: '2026-07-13',
  room: { number: '101', type: 'SUITE' },
  rateSnapshot: 150,
  roomTotal: 450,
  subtotal: 450,
  grandTotal: 450,
  employee: { firstName: 'Ana', lastName: 'Gómez' },
  discounts: [{ name: 'Temporada', percentage: 10, amount: 50 }],
  charges: [{ description: 'Minibar', amount: 20, category: 'Consumo' }],
};

describe('buildComprobantePdf', () => {
  it('devuelve un Buffer PDF no vacío', async () => {
    const pdf = await buildComprobantePdf(base);
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
