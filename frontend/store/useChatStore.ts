import { create } from 'zustand';
import type { ChatState, Message } from '@/types/message.types';

/**
 * Store de Zustand para la gestión del chat y la UI relacionada.
 * 
 * QUÉ: Maneja la lista de mensajes, el estado de la IA y el sidebar.
 * POR QUÉ: Permite que múltiples componentes (Sidebar, Mensajes, Input) compartan estado de forma reactiva.
 * PROBLEMA QUE RESUELVE: Centraliza la sincronización de mensajes en tiempo real y controla la visibilidad lateral.
 */
export const useChatStore = create<ChatState>((set) => ({
  // --- ESTADO (STATE) ---
  
  /** Lista reactiva de mensajes (sincronizada en tiempo real) */
  messages: [],

  /** Estado de 'pensando' de la IA (bloquea el input durante el proceso) */
  isReplying: false,

  /** Puntero al documento de la conversación activa en Firestore */
  activeConversationId: null,

  /** Controla el layout responsivo del sidebar lateral */
  isSidebarOpen: true,

  // --- ACCIONES (ACTIONS) ---

  /** Método principal usado por el hook useRealtimeMessages para inyectar datos de Firestore. */
  setMessages: (messages: Message[]) => set({ messages }),

  /** Permite añadir un mensaje de forma local antes de que llegue del servidor. */
  addMessage: (message: Message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  /** Controla el feedback visual de carga en la burbuja de la IA. */
  setReplying: (isReplying: boolean) => set({ isReplying }),

  /** Selecciona una conversación diferente del historial. */
  setActiveConversationId: (activeConversationId: string | null) => set({ activeConversationId }),

  /** Toggle de UI para optimización de espacio en pantalla. */
  setSidebarOpen: (isSidebarOpen: boolean) => set({ isSidebarOpen }),
}));
