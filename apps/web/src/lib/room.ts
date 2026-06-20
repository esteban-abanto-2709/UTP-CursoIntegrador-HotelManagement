export const ROOM_TYPES = ["SINGLE", "DOUBLE", "SUITE"] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  SINGLE: "Sencilla",
  DOUBLE: "Doble",
  SUITE: "Suite",
};

export function getRoomTypeLabel(type: string): string {
  return ROOM_TYPE_LABELS[type as RoomType] ?? type;
}

export const ROOM_TYPE_OPTIONS: { value: RoomType; label: string }[] =
  ROOM_TYPES.map((value) => ({ value, label: ROOM_TYPE_LABELS[value] }));
