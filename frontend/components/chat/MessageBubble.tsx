import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typewriter } from '@/components/ui/Typewriter';
import type { Message } from '@/types/message.types';


interface MessageBubbleProps {
  message: Message;
  userPhotoURL?: string | null;
  userInitials?: string;
  animate?: boolean;
}


function formatTime(createdAt: Message['createdAt']): string {
  if (!createdAt || !('toDate' in createdAt)) return '';
  const date = createdAt.toDate();
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * COMPONENTE MESSAGEBUBBLE (Burbuja de Chat)
 * 
 * QUÉ HACE: Renderiza un mensaje individual, ya sea del usuario o de la IA.
 * POR QUÉ EXISTE: Es la unidad básica de la interfaz de chat.
 * PROBLEMAS QUE RESUELVE:
 * 1. Diferenciación Visual: Gestiona la alineación (izquierda/derecha) y colores según el rol.
 * 2. Formato: Integra ReactMarkdown para mostrar negritas, listas y código.
 * 3. Interactividad: Soporta el efecto de escritura (Typewriter) para la IA.
 */
export function MessageBubble({ message, userPhotoURL, userInitials, animate }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex w-full gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-2`}
      // Animación suave de entrada: combina deslizamiento y opacidad para un efecto premium
      style={{ animation: 'messageAppear 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
    >
      {/* SECCIÓN: AVATAR / LOGO */}
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ring-1 overflow-hidden shadow-lg ${
          isUser
            ? 'border border-[#1ebbf4]/30 shadow-[0_0_15px_rgba(30,187,244,0.2)]'
            : 'bg-gradient-to-br from-[#1ebbf4] to-[#c2ebfa] ring-[#1ebbf4]/50 shadow-[#1ebbf4]/30'
        }`}
      >
        {isUser ? (
          // Avatar del usuario (foto de Google o iniciales)
          userPhotoURL ? (
            <img src={userPhotoURL} alt="User" className="size-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1ebbf4] to-[#84d6f6] text-sm font-bold text-[#0a0a0f]">
              {userInitials || 'U'}
            </div>
          )
        ) : (
          // Logo de Fidooo para la IA
          <img src="/assets/assistant-logo.png" alt="AI" className="size-full object-cover" />
        )}
      </div>

      {/* SECCIÓN: CONTENIDO DEL MENSAJE */}
      <div
        className={`relative max-w-[80%] rounded-3xl px-5 py-4 text-[15px] leading-relaxed backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${
          isUser
            ? 'rounded-tr-sm border border-white/10 bg-white/5 text-white shadow-black/20'
            : 'rounded-tl-sm border border-[#1ebbf4]/20 bg-gradient-to-br from-[#1ebbf4]/10 to-[#84d6f6]/5 text-white/90 shadow-[0_0_15px_rgba(30,187,244,0.1)]'
        }`}
      >
        {/* RENDERIZADO CONDICIONAL: Si es el último mensaje de la IA, usamos Typewriter. Si no, renderizado directo. */}
        {animate && message.role === 'assistant' ? (
          <Typewriter key={message.id} text={message.content} speed={40}>
            {(partialText) => (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // Estilización personalizada de Markdown para que coincida con el diseño premium
                  p: ({ children }) => <p className="m-0 whitespace-pre-wrap break-words">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                  em: ({ children }) => <em className="italic text-white underline decoration-[#1ebbf4]/40 underline-offset-4">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc ml-4 my-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-4 my-2">{children}</ol>,
                  code: ({ children }) => <code className="bg-white/10 px-1 rounded text-[#1ebbf4] font-mono text-sm">{children}</code>,
                }}
              >
                {partialText}
              </ReactMarkdown>
            )}
          </Typewriter>
        ) : (
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="m-0 whitespace-pre-wrap break-words">{children}</p>,
              strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
              em: ({ children }) => <em className="italic text-white underline decoration-[#1ebbf4]/40 underline-offset-4">{children}</em>,
              ul: ({ children }) => <ul className="list-disc ml-4 my-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-4 my-2">{children}</ol>,
              code: ({ children }) => <code className="bg-white/10 px-1 rounded text-[#1ebbf4] font-mono text-sm">{children}</code>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}

        {/* METADATO: Hora del mensaje */}
        <span
          className={`mt-2 block text-right text-[10px] uppercase tracking-wider font-semibold ${isUser ? 'text-white/40' : 'text-[#1ebbf4]/70'}`}
        >
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

/**
 * ESQUELETO DE CARGA (Thinking State)
 * 
 * Se muestra mientras la IA está generando una respuesta en el backend.
 */
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
