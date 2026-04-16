import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { app } from './config';
import type { Message, MessageRole } from '@/types/message.types';

const db: Firestore = getFirestore(app);

export { db };

export function subscribeToMessages(
  userId: string,
  callback: (messages: Message[]) => void,
): Unsubscribe {
  const messagesRef = collection(db, 'chats', userId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const messages: Message[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Message, 'id'>),
    }));
    callback(messages);
  });
}

export async function clearChat(userId: string): Promise<void> {
  const messagesRef = collection(db, 'chats', userId, 'messages');
  const snapshot = await onSnapshot(query(messagesRef), () => {});
  // Note: For simplicity in this demo, we can just delete docs one by one 
  // but a better way is a Batch delete.
  const { getDocs, deleteDoc, doc } = await import('firebase/firestore');
  const docs = await getDocs(messagesRef);
  const batch = docs.docs.map(d => deleteDoc(doc(db, 'chats', userId, 'messages', d.id)));
  await Promise.all(batch);
}

export async function addMessage(
  userId: string,
  content: string,
  role: MessageRole,
): Promise<void> {
  const messagesRef = collection(db, 'chats', userId, 'messages');
  await addDoc(messagesRef, {
    content,
    role,
    userId,
    createdAt: serverTimestamp(),
  });
}

/**
 * Clear all messages for a specific user
 */
export async function deleteMessages(userId: string): Promise<void> {
  const { getDocs, deleteDoc, doc } = await import('firebase/firestore');
  const messagesRef = collection(db, 'chats', userId, 'messages');
  const snapshot = await getDocs(messagesRef);
  
  const deletePromises = snapshot.docs.map((document) => 
    deleteDoc(doc(db, 'chats', userId, 'messages', document.id))
  );
  
  await Promise.all(deletePromises);
}
