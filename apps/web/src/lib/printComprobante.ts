import api from "@/lib/axios";
import { routes } from "@/lib/routes";

// El PDF lo genera el backend (Puppeteer) — misma fuente que el correo.
// Aquí solo lo descargamos y disparamos el "guardar" del navegador.
export async function generarComprobante(reservationId: number): Promise<void> {
  const res = await api.get(routes.api.reservations.comprobante(reservationId), {
    responseType: "blob",
  });

  const disposition = String(res.headers["content-disposition"] ?? "");
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const filename = match
    ? decodeURIComponent(match[1])
    : `comprobante-${reservationId}.pdf`;

  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
