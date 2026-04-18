'use client';

import { useState, useEffect } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

/**
 * Componente Typewriter.
 * 
 * QUÉ: Muestra texto letra por letra.
 * POR QUÉ: Produce un efecto visual de "IA escribiendo" que mejora la experiencia del usuario.
 * PROBLEMA QUE RESUELVE: Evita el despliegue brusco del texto largo.
 */
export function Typewriter({ text, speed = 20, onComplete }: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Si el texto cambia radicalmente (nuevo mensaje), reseteamos
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

  return <span>{displayText}</span>;
}
