import { buildVoucherPdf } from './voucher-pdf';

describe('buildVoucherPdf', () => {
  it('devuelve un Buffer PDF no vacío', async () => {
    const pdf = await buildVoucherPdf({
      code: 'RSV-TEST',
      guestName: 'Test',
      roomNumber: '1',
      checkIn: '2026-07-10',
      checkOut: '2026-07-11',
      nights: 1,
      total: 100,
    });
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
