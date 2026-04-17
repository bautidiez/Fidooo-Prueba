'use client';

import { useEffect } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';
import { useAuthStore } from '@/store/useAuthStore';
import type { User } from '@/types/user.types';

/**
 * Hook personalizado para gestionar el estado de autenticación.
 * 
 * QUÉ: Escucha cambios en el estado de Firebase Auth.
 * POR QUÉ: Permite que cualquier componente sepa si hay un usuario logueado.
 * PROBLEMA QUE RESUELVE: Mantener sincronizado el store global con la persistencia de Firebase.
 */
export function useAuth(): { user: User | null; isLoading: boolean } {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Escucha el cambio de estado de autenticación (login, logout, token refresh)
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // Mapeo del objeto de Firebase a nuestro tipo de dominio User
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
          };
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in onAuthStateChanged:', error);
      } finally {
        // Una vez que Firebase responde, dejamos de cargar pase lo que pase
        setLoading(false);
      }
    });

    /**
     * IMPORTANTE: Cleanup de useEffect.
     * Al retornar la función de desuscripción, evitamos fugas de memoria (memory leaks)
     * al destruir el componente o re-ejecutar el efecto.
     */
    return () => unsubscribe();
  }, [setUser, setLoading]);

  return { user, isLoading };
}

/**
 * Obtiene el ID Token de Firebase para enviarlo al backend en peticiones seguras.
 * @returns {Promise<string | null>} El token JWT o null si no hay sesión.
 */
export async function getIdToken(): Promise<string | null> {
  const { currentUser } = auth;
  if (!currentUser) return null;
  return currentUser.getIdToken();
}
