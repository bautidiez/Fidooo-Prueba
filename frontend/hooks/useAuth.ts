'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, getRedirectResult, type User as FirebaseUser } from 'firebase/auth';
import { auth, setSessionCookie } from '@/lib/firebase/auth';
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
  const router = useRouter();
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    /**
     * OBSERVER DE FIREBASE: onAuthStateChanged.
     * Escucha activamente cambios en la sesión (Login, Logout, Token Refresh).
     */
    console.log('[useAuth] Iniciando observer onAuthStateChanged...');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log(`[useAuth] Cambio de estado: ${firebaseUser ? 'USUARIO_PRESENTE (' + firebaseUser.uid + ')' : 'SIN_SESION'}`);
      try {
        if (firebaseUser) {
          // MAPEO: Convertimos el objeto de Firebase a nuestro tipo de dominio User.
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
          };
          setUser(user);

          // AUTO-SINCRONIZACIÓN DE COOKIE:
          // Aseguramos que la cookie esté siempre presente para el Middleware.
          const token = await firebaseUser.getIdToken();
          setSessionCookie(token);
          console.log('[useAuth] Sesión sincronizada con éxito.');
        } else {
          // Si no hay sesión, nos aseguramos de que el store esté limpio.
          setUser(null);
        }
      } catch (error) {
        console.error('Error in onAuthStateChanged:', error);
      } finally {
        // FINALIZACIÓN: Dejamos de mostrar el spinner una vez que Firebase responde.
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
