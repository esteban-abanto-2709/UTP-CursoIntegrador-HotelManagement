export type RoomStatus =
  | "disponible"
  | "ocupada"
  | "limpieza"
  | "mantenimiento";

export interface Room {
  id: string;
  number: string;
  type: string;
  status: RoomStatus;
  price: number;
}

export const mockRooms: Room[] = [
  {
    id: "101",
    number: "101",
    type: "Sencilla",
    status: "disponible",
    price: 50,
  },
  { id: "102", number: "102", type: "Doble", status: "ocupada", price: 80 },
  { id: "103", number: "103", type: "Suite", status: "limpieza", price: 150 },
  {
    id: "104",
    number: "104",
    type: "Sencilla",
    status: "disponible",
    price: 50,
  },
  {
    id: "105",
    number: "105",
    type: "Doble",
    status: "mantenimiento",
    price: 80,
  },
  { id: "201", number: "201", type: "Doble", status: "disponible", price: 80 },
  { id: "202", number: "202", type: "Suite", status: "ocupada", price: 150 },
  { id: "203", number: "203", type: "Sencilla", status: "limpieza", price: 50 },
  { id: "204", number: "204", type: "Doble", status: "disponible", price: 80 },
  { id: "205", number: "205", type: "Suite", status: "ocupada", price: 150 },
];

export interface Reservation {
  id: string;
  guestName: string;
  dni: string;
  roomId: string; // Relacionado al cuarto
  checkIn: string;
  checkOut: string;
  status: "pendiente" | "activa" | "completada" | "cancelada";
}

export const mockReservations: Reservation[] = [
  {
    id: "RES-001",
    guestName: "Juan Pérez",
    dni: "12345678",
    roomId: "102",
    checkIn: "2026-04-15",
    checkOut: "2026-04-18",
    status: "activa",
  },
  {
    id: "RES-002",
    guestName: "María García",
    dni: "87654321",
    roomId: "202",
    checkIn: "2026-04-14",
    checkOut: "2026-04-16",
    status: "activa",
  },
  {
    id: "RES-003",
    guestName: "Carlos López",
    dni: "11223344",
    roomId: "101",
    checkIn: "2026-04-16",
    checkOut: "2026-04-20",
    status: "pendiente",
  },
];
