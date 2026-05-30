import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: number;
  username: string;
  role: "OWNER" | "MANAGER" | "EMPLOYEE";
  nombres?: string | null;
  apellidoPaterno?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => {
        set({ user: null, token: null });
        // También limpiamos cookies u otros datos si es necesario
      },
    }),
    {
      name: "lumina-auth-storage", // Nombre bajo el cual se guarda en LocalStorage
    },
  ),
);
