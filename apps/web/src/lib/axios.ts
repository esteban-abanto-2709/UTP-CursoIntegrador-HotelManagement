import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Interceptor de Peticiones (Request)
// Antes de que el frontend envíe cualquier cosa, Axios se detiene aquí y pega el Token.
api.interceptors.request.use(
  (config) => {
    // Leemos el token directamente de la bóveda de Zustand
    const token = useAuthStore.getState().token;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Interceptor de Respuestas (Response)
// Si la API nos devuelve un error 401 (Unauthorized), automáticamente borramos la sesión
// y mandamos al usuario al Login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      
      // Solo redirigir si NO estamos ya en la pantalla de login.
      // Si estamos en el login, dejamos que el componente maneje el error (para no recargar la página).
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
