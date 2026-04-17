'use client';

import { useEffect } from 'react';
import { subscribeToMessages } from '@/lib/firebase/firestore';
import { useChatStore } from '@/store/useChatStore';
import type { Message } from '@/types/message.types';

/**
 * Hook para la sincronización de mensajes en tiempo real desde Firestore.
 * 
 * QUÉ: Establece un listener activo sobre la colección de mensajes.
 * POR QUÉ: Permite una experiencia de chat fluida sin necesidad de refrescar o consultar periódicamente (polling).
 * PROBLEMA QUE RESUELVE: Mantener la interfaz actualizada instantáneamente cuando llega una nueva respuesta de la IA.
 * 
 * @param {string | null} userId - ID del usuario actual.
 * @param {string | null} conversationId - ID de la conversación abierta.
 * @returns {Object} Mensajes y estado de escritura.
 */
export function useRealtimeMessages(
  userId: string | null | undefined,
  conversationId: string | null
): {
  messages: Message[];
  isReplying: boolean;
} {
  const { messages, isReplying, setMessages } = useChatStore();

  useEffect(() => {
    // Si no hay usuario o conversación seleccionada, no hacemos nada
    if (!userId || !conversationId) {
      setMessages([]); // Resetear mensajes al cambiar a una conversación vacía o cerrar sesión
      return;
    }

    /**
     * SUSCRIPCIÓN ACTIVA: Se conecta a Firestore y escucha cambios en la colección.
     * Retorna una función 'unsubscribe' que detiene la escucha.
     */
    const unsubscribe = subscribeToMessages(userId, conversationId, (msgs: Message[]) => {
      setMessages(msgs);
    });

    /**
     * CLEANUP (IMPORTANTE): Al retornar 'unsubscribe', React lo ejecutará automáticamente 
     * cuando el componente se desmonte o cambien las dependencias.
     * Esto previene:
     * 1. Memory Leaks: El listener no sigue corriendo en segundo plano.
     * 2. Billing: Evita lecturas accidentales y costos innecesarios en Firebase.
     * 3. Errores de Estado: Evita intentar actualizar componentes que ya no existen.
     */
    return () => unsubscribe();
  }, [userId, conversationId, setMessages]);

  return { messages, isReplying };
}
