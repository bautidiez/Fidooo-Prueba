import { create } from 'zustand';
import type { AuthState, User } from '@/types/user.types';

/**
 * Store de Zustand para la gestión del estado de autenticación.
 * 
 * QUÉ: Centraliza la información del usuario logueado en toda la aplicación.
 * POR QUÉ: Evita el "prop drilling" y permite reaccionar a cambios de sesión de forma global.
 * PROBLEMA QUE RESUELVE: Mantiene sincronizado si hay un usuario activo y su estado de carga inicial.
 */
export const useAuthStore = create<AuthState>((set) => ({
  // --- Estado ---
  /** Usuario actualmente autenticado (null si no hay sesión) */
  user: null,
  /** Indicador de si se está recuperando la sesión de Firebase al inicio */
  isLoading: true,

  // --- Acciones ---
  /** Actualiza el estado del usuario tras el login o cambio de estado de auth */
  setUser: (user: User | null) => set({ user }),
  /** Limpia el estado del usuario al cerrar sesión */
  clearUser: () => set({ user: null }),
  /** Controla el spinner global de carga de sesión */
  setLoading: (isLoading: boolean) => set({ isLoading }),
}));
