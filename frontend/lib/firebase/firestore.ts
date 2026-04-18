/**
 * CAPA DE PERSISTENCIA Y TIEMPO REAL - FIRESTORE (LADO CLIENTE)
 * 
 * QUÉ HACE: Gestiona la lectura, escritura y escucha activa (listeners) de mensajes y conversaciones.
 * POR QUÉ EXISTE: Centraliza el modelo de datos y las consultas de base de datos para todo el frontend.
 * PROBLEMAS QUE RESUELVE:
 * 1. Sincronización en tiempo real: Permite que el chat se actualice solo cuando llega una respuesta de la IA.
 * 2. Latencia Percibida: Maneja el guardado local y sincronización con el servidor.
 * 3. Consistencia de Datos: Garantiza que los mensajes se muestren en el orden cronológico correcto.
 */

import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  deleteDoc,
  type Firestore,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { app } from './config';
import type { Message, MessageRole, Conversation } from '@/types/message.types';

/** Instancia central de la base de datos Firestore */
const db: Firestore = getFirestore(app);

export { db };

/**
 * ESCUCHA DE MENSAJES EN TIEMPO REAL
 * 
 * Conecta el frontend con una conversación específica en Firestore y notifica cualquier cambio.
 * 
 * @param userId - ID del usuario propietario de los mensajes.
 * @param conversationId - ID de la conversación a observar.
 * @param callback - Función que se ejecuta cada vez que el listado de mensajes cambia.
 * @returns Función de desuscripción para limpiar el listener y ahorrar recursos.
 */
export function subscribeToMessages(
  userId: string,
  conversationId: string,
  callback: (messages: Message[]) => void,
): Unsubscribe {
  const messagesRef = collection(db, 'chats', userId, 'conversations', conversationId, 'messages');
  
  // Consultamos por fecha de creación ascendente
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const rawMessages: Message[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Message, 'id'>),
    }));

    /**
     * FIX CRÍTICO - ORDENAMIENTO DE ESCRITURAS PENDIENTES:
     * Cuando el usuario envía (prompt), Firestore tiene un delay hasta confirmar el timestamp.
     * Si la IA responde muy rápido, el mensaje de la IA llega CON timestamp mientras el del usuario sigue en NULL.
     * Forzamos que el mensaje del usuario (pendiente) aparezca SIEMPRE antes que la respuesta de la IA.
     */
    const sortedMessages = [...rawMessages].sort((a, b) => {
      // Valor de tiempo para comparación (usamos 0 para pendientes de usuario, para que vayan al inicio de su bloque)
      const getTime = (m: Message) => {
        if (m.createdAt) return m.createdAt.toMillis();
        // Si no tiene fecha, es una escritura local pendiente. 
        // Le asignamos el tiempo actual, pero restamos 1ms si es usuario para que gane la posición anterior a la IA.
        return Date.now() + (m.role === 'assistant' ? 1 : 0);
      };

      return getTime(a) - getTime(b);
    });

    callback(sortedMessages);
  });
}

/**
 * ESCUCHA DE CONVERSACIONES EN TIEMPO REAL
 * 
 * Recupera el historial de chats del usuario para mostrarlo en el Sidebar lateral.
 * 
 * @param userId - ID del usuario.
 * @param callback - Función que recibe la lista de conversaciones.
 */
export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void,
): Unsubscribe {
  const convsRef = collection(db, 'chats', userId, 'conversations');
  const q = query(convsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const conversations: Conversation[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Conversation, 'id'>),
    }));
    callback(conversations);
  });
}

/**
 * CREACIÓN DE NUEVA CONVERSACIÓN
 * 
 * Inicializa un documento de conversación vacío en Firestore.
 * 
 * @param userId - ID del usuario.
 * @param title - Título inicial (si no se provee, se usa uno por defecto).
 * @returns ID único de la nueva conversación.
 */
export async function createConversation(userId: string, title: string = 'Nueva conversación'): Promise<string> {
  const convsRef = collection(db, 'chats', userId, 'conversations');
  const newRef = doc(convsRef);
  
  await setDoc(newRef, {
    title,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  return newRef.id;
}

/**
 * PERSISTENCIA DE MENSAJES (Lado Cliente)
 * 
 * Guarda un mensaje en la subcolección de una conversación y actualiza los metadatos globales.
 * 
 * @param userId - ID del usuario.
 * @param conversationId - ID de la conversación destino.
 * @param content - Texto del mensaje.
 * @param role - Rol del emisor ('user' o 'assistant').
 */
export async function addMessage(
  userId: string,
  conversationId: string,
  content: string,
  role: MessageRole,
): Promise<void> {
  const messagesRef = collection(db, 'chats', userId, 'conversations', conversationId, 'messages');
  const convRef = doc(db, 'chats', userId, 'conversations', conversationId);

  // 1. Inserción del mensaje con timestamp del servidor
  await addDoc(messagesRef, {
    content,
    role,
    userId,
    createdAt: serverTimestamp(),
  });

  // 2. Lógica de Título Dinámico: Si es el primer mensaje del usuario, definimos el título del chat.
  if (role === 'user') {
    const snapshot = await getDocs(messagesRef);
    if (snapshot.size <= 1) {
      const title = content.slice(0, 40) + (content.length > 40 ? '...' : '');
      await setDoc(convRef, { title }, { merge: true });
    }
  }

  // 3. Toque de Actividad: Actualizamos 'updatedAt' para que el chat suba al tope en el Sidebar.
  await setDoc(convRef, {
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * ELIMINACIÓN DE CHATS
 * 
 * Borra una conversación completa y todos sus mensajes asociados.
 */
export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  const messagesRef = collection(db, 'chats', userId, 'conversations', conversationId, 'messages');
  const convRef = doc(db, 'chats', userId, 'conversations', conversationId);

  const docs = await getDocs(messagesRef);
  const deleteBatch = docs.docs.map(d => deleteDoc(d.ref));
  await Promise.all(deleteBatch);
  await deleteDoc(convRef);
}

/**
 * LIMPIEZA DE CHAT (Legacy Support)
 * 
 * Simplemente un alias para borrar la conversación seleccionada.
 */
export async function clearChat(userId: string, conversationId?: string): Promise<void> {
  if (!conversationId) return;
  await deleteConversation(userId, conversationId);
}
