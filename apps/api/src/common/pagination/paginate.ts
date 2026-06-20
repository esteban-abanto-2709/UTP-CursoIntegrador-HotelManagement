import {
  CursorPaginationDto,
  DEFAULT_TAKE,
  MAX_TAKE,
} from './cursor-pagination.dto';

export interface CursorPage<T> {
  data: T[];
  total: number;
  nextCursor: number | null;
  hasNext: boolean;
}

// null => sin ventana: el endpoint devuelve todo (consumidores no paginados).
function resolveTake(take?: string): number | null {
  if (take === undefined) return null;
  const n = Number(take);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_TAKE;
  return Math.min(Math.floor(n), MAX_TAKE);
}

export function cursorArgs(dto: CursorPaginationDto): {
  take?: number;
  cursor?: { id: number };
  skip?: number;
} {
  const take = resolveTake(dto.take);
  if (take === null) return {};
  const cursorId = dto.cursor ? Number(dto.cursor) : undefined;
  return cursorId
    ? { take: take + 1, cursor: { id: cursorId }, skip: 1 }
    : { take: take + 1 };
}

export function buildPage<T extends { id: number }>(
  rows: T[],
  dto: CursorPaginationDto,
): { data: T[]; nextCursor: number | null; hasNext: boolean } {
  const take = resolveTake(dto.take);
  if (take === null) {
    return { data: rows, nextCursor: null, hasNext: false };
  }
  const hasNext = rows.length > take;
  const data = hasNext ? rows.slice(0, take) : rows;
  const nextCursor = hasNext ? data[data.length - 1].id : null;
  return { data, nextCursor, hasNext };
}
