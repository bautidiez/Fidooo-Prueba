import { create } from 'zustand';
import type { ChatState, Message } from '@/types/message.types';

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isReplying: false,
  activeConversationId: null,
  isSidebarOpen: true,
  setMessages: (messages: Message[]) => set({ messages }),
  addMessage: (message: Message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setReplying: (isReplying: boolean) => set({ isReplying }),
  setActiveConversationId: (activeConversationId: string | null) => set({ activeConversationId }),
  setSidebarOpen: (isSidebarOpen: boolean) => set({ isSidebarOpen }),
}));
