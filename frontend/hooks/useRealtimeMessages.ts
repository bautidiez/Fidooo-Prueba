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
     * Suscripción a Firestore (onSnapshot).
     * Este listener se activa cada vez que hay un cambio en la colección filtrada.
     */
    const unsubscribe = subscribeToMessages(userId, conversationId, (msgs: Message[]) => {
      setMessages(msgs);
    });

    /**
     * CLEANUP: Es vital desuscribirse para evitar memory leaks y consumo innecesario
     * de lecturas en Firebase cuando el componente se desmonta.
     */
    return () => unsubscribe();
  }, [userId, conversationId, setMessages]);

  return { messages, isReplying };
}
