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
  // --- Estado ---
  /** Lista de mensajes de la conversación activa */
  messages: [],
  /** Indica si la IA está procesando una respuesta actualmente */
  isReplying: false,
  /** ID de la conversación que se está visualizando */
  activeConversationId: null,
  /** Controla si el sidebar (historial) está desplegado */
  isSidebarOpen: true,

  // --- Acciones ---
  /** Reemplaza la lista completa de mensajes (usado por el listener onSnapshot) */
  setMessages: (messages: Message[]) => set({ messages }),
  /** Agrega un nuevo mensaje individual al final de la lista (optimista) */
  addMessage: (message: Message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  /** Activa/Desactiva el estado de escritura de la IA */
  setReplying: (isReplying: boolean) => set({ isReplying }),
  /** Cambia la conversación seleccionada */
  setActiveConversationId: (activeConversationId: string | null) => set({ activeConversationId }),
  /** Alterna la visibilidad del sidebar */
  setSidebarOpen: (isSidebarOpen: boolean) => set({ isSidebarOpen }),
}));
