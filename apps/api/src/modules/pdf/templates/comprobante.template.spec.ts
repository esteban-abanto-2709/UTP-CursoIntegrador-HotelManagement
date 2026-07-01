import { buildComprobanteHtml, type ComprobanteData } from './comprobante.template';

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

describe('buildComprobanteHtml', () => {
  it('incluye folio, huésped, total y monto en letras', () => {
    const html = buildComprobanteHtml(base);
    expect(html).toContain('B001 - 0000042'); // folio
    expect(html).toContain('Juan Pérez');
    expect(html).toContain('Suite'); // etiqueta de tipo, no el código
    expect(html).toContain('S/ 450.00');
    expect(html).toContain('SOLES'); // numeroALetras
    expect(html).toContain('Minibar'); // cargo extra
  });

  it('escapa HTML para evitar inyección desde datos', () => {
    const html = buildComprobanteHtml({
      ...base,
      guest: { ...base.guest, fullName: '<script>x</script>' },
    });
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
