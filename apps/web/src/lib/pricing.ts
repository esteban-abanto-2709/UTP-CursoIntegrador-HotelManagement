const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function calcNights(checkIn: string, checkOut: string) {
  const diff =
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / MS_PER_DAY;
  return Math.max(1, Math.ceil(diff));
}
