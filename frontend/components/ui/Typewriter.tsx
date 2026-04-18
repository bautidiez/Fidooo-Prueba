'use client';

import { useState, useEffect } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  children?: (text: string) => React.ReactNode;
}

/**
 * Componente Typewriter.
 * 
 * QUÉ: Muestra texto letra por letra.
 * POR QUÉ: Produce un efecto visual de "IA escribiendo" que mejora la experiencia del usuario.
 * PROBLEMA QUE RESUELVE: Evita el despliegue brusco del texto largo y permite renderizado dinámico (Markdown).
 */
export function Typewriter({ text, speed = 25, delay = 0, onComplete, children }: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reinicio total cuando cambia el texto base
  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  if (children) {
    return <>{children(displayText)}</>;
  }

  return <span>{displayText}</span>;
}
