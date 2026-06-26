import api from "./axios";

// Descarga un archivo binario (p. ej. .xlsx) desde la API a través del proxy,
// respetando el nombre que envíe el backend en Content-Disposition.
export async function downloadFile(url: string, fallbackName: string) {
  const res = await api.get(url, { responseType: "blob" });

  const disposition = res.headers["content-disposition"] as string | undefined;
  let filename = fallbackName;
  if (disposition) {
    const match = /filename\*?=(?:UTF-8'')?"?([^"\n;]+)"?/i.exec(disposition);
    if (match) filename = decodeURIComponent(match[1].trim());
  }

  const blobUrl = URL.createObjectURL(res.data as Blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
