import type { ReactNode } from 'react';

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="flex h-dvh flex-col bg-[#0a0a0f]">
      {children}
    </div>
  );
}
