import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'FidoooChat — Fidooo Engineering AI',
  description:
    'Conversaciones inteligentes potenciadas por ChatGPT, con autenticación segura y mensajería en tiempo real. By Fidooo Engineering.',
  other: {
    google: 'notranslate',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body 
        className="font-sans antialiased bg-[#1c1c1c] text-white overflow-hidden"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
