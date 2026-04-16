'use client';

import { useEffect } from 'react';
import { subscribeToMessages } from '@/lib/firebase/firestore';
import { useChatStore } from '@/store/useChatStore';
import type { Message } from '@/types/message.types';

export function useRealtimeMessages(userId: string | null | undefined): {
  messages: Message[];
  isReplying: boolean;
} {
  const { messages, isReplying, setMessages } = useChatStore();

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToMessages(userId, (msgs: Message[]) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [userId, setMessages]);

  return { messages, isReplying };
}
