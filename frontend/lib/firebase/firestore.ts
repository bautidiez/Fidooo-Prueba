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

const db: Firestore = getFirestore(app);

export { db };

/**
 * Listen to messages in a specific conversation
 */
export function subscribeToMessages(
  userId: string,
  conversationId: string,
  callback: (messages: Message[]) => void,
): Unsubscribe {
  const messagesRef = collection(db, 'chats', userId, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const messages: Message[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Message, 'id'>),
    }));
    callback(messages);
  });
}

/**
 * Get all conversations for a user
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
 * Create a new conversation entry
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
 * Add a message to a specific conversation
 */
export async function addMessage(
  userId: string,
  conversationId: string,
  content: string,
  role: MessageRole,
): Promise<void> {
  const messagesRef = collection(db, 'chats', userId, 'conversations', conversationId, 'messages');
  const convRef = doc(db, 'chats', userId, 'conversations', conversationId);

  // 1. Add message
  await addDoc(messagesRef, {
    content,
    role,
    userId,
    createdAt: serverTimestamp(),
  });

  // 2. If it's the first user message, update the title
  if (role === 'user') {
    const snapshot = await getDocs(messagesRef);
    if (snapshot.size <= 1) {
      const title = content.slice(0, 40) + (content.length > 40 ? '...' : '');
      await setDoc(convRef, { title }, { merge: true });
    }
  }

  // 3. Update updatedAt
  await setDoc(convRef, {
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Delete a specific conversation and its messages
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
 * Legacy support for clear chat (deletes messages of active conversation)
 */
export async function clearChat(userId: string, conversationId?: string): Promise<void> {
  if (!conversationId) return;
  await deleteConversation(userId, conversationId);
}
