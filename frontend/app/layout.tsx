import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'FidoooChat — Fidooo Engineering AI',
  description:
    'Conversaciones inteligentes potenciadas por ChatGPT, con autenticación segura y mensajería en tiempo real. By Fidooo Engineering.',
  icons: {
    icon: '/assets/assistant-logo.png',
  },
  other: {
    google: 'notranslate',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
