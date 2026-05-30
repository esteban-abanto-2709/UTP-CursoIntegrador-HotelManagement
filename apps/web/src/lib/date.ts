export function formatDate(value: string | Date): string {
  let y: number;
  let m: number;
  let d: number;

  if (typeof value === "string") {
    const [yy, mm, dd] = value.split("T")[0].split("-").map(Number);
    y = yy;
    m = mm;
    d = dd;
  } else {
    y = value.getFullYear();
    m = value.getMonth() + 1;
    d = value.getDate();
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d)}/${pad(m)}/${y}`;
}
