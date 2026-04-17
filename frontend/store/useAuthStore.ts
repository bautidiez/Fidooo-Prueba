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
  // --- ESTADO (STATE) ---
  
  /** 
   * Usuario actualmente autenticado. 
   * Se inicializa en null hasta que onAuthStateChanged responda. 
   */
  user: null,

  /** 
   * Indicador de carga inicial.
   * Evita que la app muestre contenido protegido antes de verificar la sesión.
   */
  isLoading: true,

  // --- ACCIONES (ACTIONS) ---

  /** Sincroniza el usuario autenticado con el store global. */
  setUser: (user: User | null) => set({ user }),

  /** Elimina los datos del usuario (útil en Logout). */
  clearUser: () => set({ user: null }),

  /** Cambia el estado del spinner global. */
  setLoading: (isLoading: boolean) => set({ isLoading }),
}));
