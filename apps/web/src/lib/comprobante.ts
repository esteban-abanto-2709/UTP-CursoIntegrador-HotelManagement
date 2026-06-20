export const EMPRESA = {
  nombreComercial: "Mirador",
  razonSocial: "MIRADOR HOTEL SUITE S.A.C.",
  ruc: "20603847156",
  direccion: "Av. del Ejército N° 748, Miraflores",
  ciudad: "Lima - Lima - Perú",
  telefono: "(01) 445-2210",
  email: "recepcion@miradorhotel.pe",
  serie: "B001",
} as const;

const IGV_RATE = 0.18;

export function formatCorrelativo(paymentId: number): string {
  return `${EMPRESA.serie} - ${String(paymentId).padStart(7, "0")}`;
}

export function igvBreakdown(grandTotal: number): { base: number; igv: number } {
  const base = Math.round((grandTotal / (1 + IGV_RATE)) * 100) / 100;
  const igv = Math.round((grandTotal - base) * 100) / 100;
  return { base, igv };
}
