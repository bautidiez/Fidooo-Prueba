'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { addMessage, createConversation } from '@/lib/firebase/firestore';
import { useAuth, getIdToken } from '@/hooks/useAuth';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageBubble, MessageBubbleSkeleton } from './MessageBubble';
import { MessageInput } from './MessageInput';
import Swal from 'sweetalert2';

interface ChatWindowProps {
  userId: string;
}

let BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

// Sanitización defensiva de la URL
if (BACKEND_URL && !BACKEND_URL.startsWith('http')) {
  BACKEND_URL = `https://${BACKEND_URL}`;
}
BACKEND_URL = BACKEND_URL.replace(/\/$/, ''); // Quitar barra final si existe

/**
 * Ventana principal de mensajes del chat.
 * 
 * QUÉ: Contenedor que muestra la lista de mensajes y el input de envío.
 * POR QUÉ: Es el área central de interacción de la aplicación.
 * PROBLEMA QUE RESUELVE: Coordina el envío de mensajes al servidor (IA) y la visualización reactiva.
 */
export function ChatWindow({ userId }: ChatWindowProps) {
  const { user } = useAuth();
  const { activeConversationId, setActiveConversationId, setReplying, isReplying } = useChatStore();
  const { messages } = useRealtimeMessages(userId, activeConversationId);
  const bottomRef = useRef<HTMLDivElement>(null);

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Usuario';
  const userInitials = displayName.slice(0, 2).toUpperCase();
  const userPhotoURL = user?.photoURL;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isReplying]);

  /**
   * MANEJADOR DE ENVÍO DE MENSAJES:
   * 
   * @param {string} content - Texto del mensaje del usuario.
   * 
   * FLUJO TÉCNICO:
   * 1. Activa el estado 'replying' para bloquear el input y mostrar feedback visual.
   * 2. Si es el primer mensaje, crea una 'conversation' nueva en Firestore.
   * 3. Guarda el mensaje del 'user' en Firestore (Client SDK).
   * 4. Obtiene el Firebase ID Token (JWT) para autenticarse contra el Backend NestJS.
   * 5. Realiza un POST al backend enviando el prompt y el ID de conversación.
   * 6. El backend procesará con la IA y guardará la respuesta en Firestore.
   */
  async function handleSend(content: string): Promise<void> {
    setReplying(true);

    try {
      let currentConvId = activeConversationId;

      // 1. Persistencia de la conversación inicial:
      if (!currentConvId) {
        currentConvId = await createConversation(userId, content.slice(0, 40));
        if (!currentConvId) throw new Error('No se pudo crear la conversación en Firebase.');
        setActiveConversationId(currentConvId);
      }

      // 2. Persistencia del mensaje del usuario (Client Side):
      await addMessage(userId, currentConvId, content, 'user');

      // 3. SEGURIDAD: Obtención del JWT de Firebase para validación en NestJS:
      const idToken = await getIdToken();
      if (!idToken) throw new Error('Sesión expirada. Por favor, reingresá.');

      // 4. COMUNICACIÓN BACKEND:
      if (!currentConvId) throw new Error('ID de conversación no encontrado.');

      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`, // Header fundamental para el AuthGuard
        },
        body: JSON.stringify({ 
          message: content,
          conversationId: currentConvId 
        }),
      });

      // Manejo defensivo de errores del servidor:
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = (await response.json()) as { message?: string };
          throw new Error(data.message ?? 'Error en la respuesta de IA');
        } else {
          throw new Error('Error en la comunicación con el servidor AI.');
        }
      }

      // IMPORTANTE: La respuesta del asistente NO se maneja aquí.
      // Se maneja a través del listener onSnapshot de Firestore en el hook useRealtimeMessages.
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error.message || 'Error de conexión / Permisos';
      
      // Fallback: Mostrar el error como un mensaje del asistente para mejorar la UX:
      if (activeConversationId) {
        try {
          await addMessage(userId, activeConversationId, `⚠️ Error: ${errorMessage}`, 'assistant');
        } catch (e) {
          Swal.fire({ title: 'Falla Crítica', text: errorMessage, icon: 'error' });
        }
      } else {
        Swal.fire({ title: 'Falla Crítica', text: errorMessage, icon: 'error' });
      }
    } finally {
      setReplying(false);
    }
  }

  return (
    <div className="flex h-full flex-col relative">
      {/* Background Watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-0 opacity-[0.04]">
        <div className="relative w-[400px] h-[400px]">
           <Image 
             src="/assets/logo.png" 
             alt="Watermark" 
             fill 
             className="object-contain grayscale brightness-200 contrast-150" 
           />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10" style={{ scrollbarWidth: 'thin' }}>
        {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center p-4">
          <div className="mb-6 flex size-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#1ebbf4]/20 to-[#84d6f6]/10 ring-1 ring-[#1ebbf4]/30 shadow-[0_0_50px_rgba(30,187,244,0.1)] animate-pulse overflow-hidden relative group">
             <Image 
               src="/assets/logo.png" 
               alt="AI" 
               fill 
               className="object-contain p-4 transition-transform duration-1000 group-hover:scale-110" 
             />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white tracking-tight drop-shadow-sm">Iniciá una conversación</h2>
          <p className="text-center text-sm text-white/50 max-w-xs leading-relaxed">
            Escribí cualquier cosa y <span className="text-[#1ebbf4] font-semibold drop-shadow-[0_0_8px_rgba(30,187,244,0.3)]">Fidooo AI</span> te responderá al instante.
          </p>
        </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                userPhotoURL={message.role === 'user' ? userPhotoURL : null}
                userInitials={userInitials}
              />
            ))}
            {isReplying && <MessageBubbleSkeleton />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} isDisabled={isReplying} />
    </div>
  );
}
