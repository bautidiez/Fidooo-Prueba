'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  isDisabled?: boolean;
}

export function MessageInput({ onSend, isDisabled = false }: MessageInputProps) {
  const [value, setValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    await submit();
  }

  async function submit(): Promise<void> {
    const trimmed = value.trim();
    if (!trimmed || isSending || isDisabled) return;

    setIsSending(true);
    setValue('');
    try {
      await onSend(trimmed);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  }

  const isLoading = isSending || isDisabled;

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center shadow-2xl p-4">
      <div className="relative flex items-center w-full">
        <textarea
          id="chat-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? 'Esperando respuesta...' : 'Escribí tu mensaje... (Enter para enviar)'}
          disabled={isLoading}
          rows={1}
          className="peer w-full resize-none rounded-3xl border border-white/10 bg-white/5 py-4 pl-6 pr-14 
            text-sm font-medium text-white placeholder-white/30 backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.2)]
            focus:border-[#1ebbf4]/50 focus:outline-none focus:ring-1 focus:ring-[#1ebbf4]/50 disabled:opacity-50
            transition-all duration-300"
          style={{ minHeight: '56px', maxHeight: '120px' }}
        />
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="absolute right-2.5 top-2.5 flex size-9 items-center justify-center rounded-2xl
            bg-gradient-to-br from-[#1ebbf4] to-[#84d6f6] text-[#0a0a0f] transition-all duration-300
            hover:scale-[1.05] disabled:cursor-not-allowed disabled:bg-white/5 disabled:bg-none disabled:text-white/20
            disabled:hover:scale-100 peer-focus:shadow-[0_0_20px_rgba(30,187,244,0.4)] shadow-[0_0_10px_rgba(30,187,244,0.2)]"
        >
          {isLoading ? (
            <span className="size-4 rounded-full border-2 border-[#0a0a0f]/30 border-t-[#0a0a0f] animate-spin" />
          ) : (
            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-7.5-15-7.5m0 15l7.5-7.5m-7.5 7.5v-15" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
