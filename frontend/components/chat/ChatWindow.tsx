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
BACKEND_URL = BACKEND_URL.replace(/\/$/, '');

/**
 * COMPONENTE CHATWINDOW (Área Central de Mensajes)
 * 
 * QUÉ HACE: Orquesta la visualización de mensajes, el estado de carga y el envío de nuevos prompts.
 * POR QUÉ EXISTE: Es el corazón de la interacción del usuario con la IA.
 * PROBLEMAS QUE RESUELVE:
 * 1. Envío y Recepción: Coordina con el backend de NestJS y escucha a Firestore.
 * 2. Feedback Visual: Gestiona el estado 'isReplying' para mostrar el esqueleto (dots).
 * 3. UX de Desplazamiento: Garantiza que el chat siempre baje automáticamente al recibir mensajes.
 * 
 * NOTA SOBRE ORDENAMIENTO: El hook useRealtimeMessages realiza un ordenamiento crítico en el cliente 
 * (basado en el timestamp de Firestore) para asegurar que los mensajes aparezcan cronológicamente 
 * correctos, evitando saltos visuales cuando la red entrega paquetes fuera de orden.
 */
export function ChatWindow({ userId }: ChatWindowProps) {
  // --- HOOKS DE ESTADO Y DATOS ---
  const { user } = useAuth();
  const { activeConversationId, setActiveConversationId, setReplying, isReplying } = useChatStore();
  
  // Sincronización en tiempo real: Recuperamos los mensajes de Firestore usando un hook personalizado.
  const { messages } = useRealtimeMessages(userId, activeConversationId);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Información del perfil para las burbujas de usuario
  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Usuario';
  const userInitials = displayName.slice(0, 2).toUpperCase();
  const userPhotoURL = user?.photoURL;

  /**
   * AUTO-SCROLL: Cada vez que hay un mensaje nuevo o cambia el estado de carga, bajamos al final.
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isReplying]);

  /**
   * MANEJADOR DE ENVÍO (Lógica de Negocio)
   */
  async function handleSend(content: string): Promise<void> {
    setReplying(true); // Bloqueamos UI y mostramos esqueleto

    try {
      let currentConvId = activeConversationId;

      // 1. Si es un chat nuevo, creamos el documento de conversación
      if (!currentConvId) {
        currentConvId = await createConversation(userId, content.slice(0, 40));
        if (!currentConvId) throw new Error('No se pudo crear la conversación.');
        setActiveConversationId(currentConvId);
      }

      // 2. Guardamos el mensaje del usuario inmediatamente
      await addMessage(userId, currentConvId, content, 'user');

      // 3. Obtenemos credenciales de Firebase para el backend
      const idToken = await getIdToken();
      if (!idToken) throw new Error('Sesión inválida.');

      // 4. Llamada al Backend NestJS
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ message: content, conversationId: currentConvId }),
      });

      if (!response.ok) throw new Error('Error en la respuesta de la IA.');

      // NOTA: No quitamos el cargando aquí. El useEffect más abajo lo hará 
      // en cuanto detecte el mensaje real en Firestore.
    } catch (error: any) {
      console.error('Error en ChatWindow:', error);
      Swal.fire({ title: 'Error', text: error.message, icon: 'error' });
      setReplying(false); // Liberamos solo en caso de error real
    }
  }

  /**
   * FIX CRÍTICO: LIMPIEZA REACTIVA DEL ESQUELETO
   * 
   * PROBLEMA: Los puntos suspensivos a veces se quedan "pegados" debajo del mensaje real por latencia del servidor.
   * SOLUCIÓN: En cuanto detectamos que el ÚLTIMO mensaje en la lista es de tipo 'assistant', 
   * forzamos que se quite el estado de carga, incluso si la petición HTTP no ha terminado de cerrarse.
   */
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && isReplying) {
      setReplying(false);
    }
  }, [messages, isReplying, setReplying]);

  return (
    <div className="flex h-full flex-col relative">
      {/* CAPA: MARCA DE AGUA (Logotipo de fondo suave) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-0 opacity-[0.04]">
        <div className="relative w-[400px] h-[400px]">
           <Image src="/assets/logo.png" alt="Watermark" fill className="object-contain grayscale" />
        </div>
      </div>

      {/* ÁREA DE MENSAJES: Lista scrollable con scrollbar fino personalizado */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 relative z-10" style={{ scrollbarWidth: 'thin' }}>
        {messages.length === 0 ? (
          // Vista de bienvenida cuando no hay mensajes todavía
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <div className="mb-6 size-24 relative animate-pulse">
               <Image src="/assets/logo.png" alt="AI" fill className="object-contain opacity-40" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Iniciá una conversación</h2>
            <p className="text-white/50 text-sm max-w-xs">Preguntame lo que quieras, Fidooo AI está para ayudarte.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Renderizado de la lista de burbujas */}
            {messages.map((message, index) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                userPhotoURL={message.role === 'user' ? userPhotoURL : null}
                userInitials={userInitials}
                // SOLO animamos el efecto máquina de escribir si es el último mensaje y es de la IA
                animate={index === messages.length - 1 && message.role === 'assistant'}
              />
            ))}
            
            {/* ESQUELETO DE CARGA: Sólo si estamos esperando y el último no es todavía la IA */}
            {/* ESQUELETO UNIFICADO: Solo se muestra si estamos en turno de respuesta y la IA aún no ha aparecido al final */}
            {isReplying && messages[messages.length - 1]?.role !== 'assistant' && (
              <MessageBubbleSkeleton key="thinking-dots" />
            )}
            
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* INPUT BAR: Control de entrada del usuario */}
      <MessageInput onSend={handleSend} isDisabled={isReplying} />
    </div>
  );
}
