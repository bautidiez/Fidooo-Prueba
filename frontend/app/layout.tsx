import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

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
      <head>
        <meta 
          httpEquiv="Content-Security-Policy" 
          content="script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.firebaseapp.com https://*.googleapis.com https://apis.google.com https://www.gstatic.com; frame-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://apis.google.com; object-src 'none';"
        />
      </head>
      <body 
        className="font-sans antialiased bg-[#1c1c1c] text-white overflow-hidden"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
