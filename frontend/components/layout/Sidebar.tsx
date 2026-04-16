'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToConversations, createConversation, deleteConversation } from '@/lib/firebase/firestore';
import { useChatStore } from '@/store/useChatStore';
import type { Conversation } from '@/types/message.types';
import Image from 'next/image';

export function Sidebar() {
  const { user } = useAuth();
  const { activeConversationId, setActiveConversationId, isSidebarOpen, setSidebarOpen } = useChatStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
    });
    return () => unsub();
  }, [user]);

  const handleCreateNew = async () => {
    if (!user || isCreating) return;
    setIsCreating(true);
    try {
      const id = await createConversation(user.uid);
      setActiveConversationId(id);
    } catch (err) {
      console.error('Error creating conversation:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteConversation(user.uid, id);
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/5 bg-[#141414]/95 backdrop-blur-2xl transition-transform duration-500 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Sidebar Header with Close Arrow */}
      <div className="flex items-center justify-between p-4">
        <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
          Historial de Chats
        </h3>
        <button 
          onClick={() => setSidebarOpen(false)}
          className="p-2 text-white/40 hover:text-white transition-all active:scale-90 cursor-pointer"
        >
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="px-4 mb-4">
        <button
          onClick={handleCreateNew}
          disabled={isCreating}
          className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-[#1ebbf4]/50 shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <svg className="size-5 text-[#1ebbf4]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva Conversación
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 thin-scrollbar">
        <h3 className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
          Historial Reciente
        </h3>
        <div className="mt-2 flex flex-col gap-1">
          {conversations.length === 0 && !isCreating ? (
            <p className="px-3 py-4 text-center text-xs text-white/20 italic">No hay chats aún</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`group relative flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-all ${
                  activeConversationId === conv.id
                    ? 'bg-[#1ebbf4]/10 border border-[#1ebbf4]/20 shadow-[0_0_15px_rgba(30,187,244,0.05)]'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex flex-1 items-center gap-3 overflow-hidden">
                  <svg className={`size-4 shrink-0 ${activeConversationId === conv.id ? 'text-[#1ebbf4]' : 'text-white/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className={`truncate text-sm font-medium ${activeConversationId === conv.id ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>
                    {conv.title}
                  </span>
                </div>
                
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-white/20 transition-all active:scale-90 cursor-pointer"
                  title="Eliminar chat"
                >
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-white/5 p-4 bg-black/20">
        <div className="flex items-center gap-3 opacity-60">
           <div className="relative size-6">
              <Image src="/assets/logo.png" alt="Fidooo" fill className="object-contain grayscale" />
           </div>
           <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Fidooo Engineering</span>
        </div>
      </div>
    </aside>
  );
}
