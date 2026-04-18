'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  children?: (text: string) => React.ReactNode;
}

export function Typewriter({ text, speed = 40, delay = 0, onComplete, children }: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const currentIndexRef = useRef<number>(0);

  // EFECTO DE REINICIO TOTAL: Si el texto cambia, reseteamos todo inmediatamente
  useEffect(() => {
    setDisplayText('');
    currentIndexRef.current = 0;
    startTimeRef.current = 0;
  }, [text]);

  const animate = useCallback((time: number) => {
    if (!startTimeRef.current) startTimeRef.current = time;
    const elapsed = time - startTimeRef.current;

    // Calculamos el índice objetivo basado en el tiempo transcurrido
    const targetIndex = Math.min(Math.floor(elapsed / speed), text.length);

    if (targetIndex > currentIndexRef.current) {
      currentIndexRef.current = targetIndex;
      setDisplayText(text.slice(0, targetIndex));
    }

    if (targetIndex < text.length) {
      requestRef.current = requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  }, [text, speed, onComplete]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  if (children) {
    return <>{children(displayText)}</>;
  }

  return <span>{displayText}</span>;
}
