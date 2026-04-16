import { create } from 'zustand';
import type { AuthState, User } from '@/types/user.types';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user: User | null) => set({ user }),
  clearUser: () => set({ user: null }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
}));
