'use client';

import { useEffect } from 'react';
import { subscribeToMessages } from '@/lib/firebase/firestore';
import { useChatStore } from '@/store/useChatStore';
import type { Message } from '@/types/message.types';

export function useRealtimeMessages(
  userId: string | null | undefined,
  conversationId: string | null
): {
  messages: Message[];
  isReplying: boolean;
} {
  const { messages, isReplying, setMessages } = useChatStore();

  useEffect(() => {
    if (!userId || !conversationId) {
      setMessages([]); // Reset when no active conversation
      return;
    }

    const unsubscribe = subscribeToMessages(userId, conversationId, (msgs: Message[]) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [userId, conversationId, setMessages]);

  return { messages, isReplying };
}
