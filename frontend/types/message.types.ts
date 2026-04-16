import type { Timestamp } from 'firebase/firestore';

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  userId: string;
  createdAt: Timestamp;
}

export interface ChatState {
  messages: Message[];
  isReplying: boolean;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setReplying: (isReplying: boolean) => void;
}
