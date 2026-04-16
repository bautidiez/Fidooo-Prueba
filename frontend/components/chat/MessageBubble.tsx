import type { Message } from '@/types/message.types';

interface MessageBubbleProps {
  message: Message;
  userPhotoURL?: string | null;
}

function formatTime(createdAt: Message['createdAt']): string {
  if (!createdAt || !('toDate' in createdAt)) return '';
  const date = createdAt.toDate();
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, userPhotoURL }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Helper to render basic markdown (bold)
  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div
      className={`flex w-full gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-2`}
      style={{ animation: 'slideIn 0.3s ease-out forwards' }}
    >
      {/* Avatar */}
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-2xl text-xs font-bold ring-1 overflow-hidden shadow-lg ${
          isUser
            ? 'bg-white/10 ring-white/20 text-white backdrop-blur-md'
            : 'bg-gradient-to-br from-[#1ebbf4] to-[#c2ebfa] ring-[#1ebbf4]/50 shadow-[#1ebbf4]/30'
        }`}
      >
        {isUser ? (
          userPhotoURL ? (
            <img src={userPhotoURL} alt="User" className="size-full object-cover" />
          ) : (
            'User'
          )
        ) : (
          <img src="/assets/assistant-logo.png" alt="AI" className="size-full object-cover" />
        )}
      </div>
 
      {/* Bubble */}
      <div
        className={`relative max-w-[80%] rounded-3xl px-5 py-4 text-[15px] leading-relaxed backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${
          isUser
            ? 'rounded-tr-sm border border-white/10 bg-white/5 text-white shadow-black/20'
            : 'rounded-tl-sm border border-[#1ebbf4]/20 bg-gradient-to-br from-[#1ebbf4]/10 to-[#84d6f6]/5 text-white/90 shadow-[0_0_15px_rgba(30,187,244,0.1)]'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{renderContent(message.content)}</p>
        <span
          className={`mt-2 block text-right text-[10px] uppercase tracking-wider font-semibold ${isUser ? 'text-white/40' : 'text-[#1ebbf4]/70'}`}
        >
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

export function MessageBubbleSkeleton() {
  return (
    <div className="flex w-full flex-row gap-4 mb-2 animate-pulse" style={{ animation: 'slideIn 0.3s ease-out forwards' }}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1ebbf4]/50 to-[#84d6f6]/30 ring-1 ring-[#1ebbf4]/20 shadow-[0_0_15px_rgba(30,187,244,0.2)] overflow-hidden">
        <img src="/assets/assistant-logo.png" alt="AI" className="size-full object-cover opacity-50" />
      </div>
      <div className="max-w-[60%] rounded-3xl rounded-tl-sm border border-[#1ebbf4]/10 bg-[#1ebbf4]/5 px-6 py-5 backdrop-blur-md flex items-center">
        <div className="flex gap-2">
          <span className="size-2.5 rounded-full bg-[#1ebbf4]/60 animate-bounce [animation-delay:0ms]" />
          <span className="size-2.5 rounded-full bg-[#1ebbf4]/60 animate-bounce [animation-delay:150ms]" />
          <span className="size-2.5 rounded-full bg-[#1ebbf4]/60 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
