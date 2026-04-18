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
  const [currentIndex, setCurrentIndex] = useState(0);
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // EFECTO DE REINICIO TOTAL: Si el texto cambia, reseteamos todo inmediatamente
  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
    startTimeRef.current = 0;
  }, [text]);

  const animate = useCallback((time: number) => {
    if (!startTimeRef.current) startTimeRef.current = time;
    const elapsed = time - startTimeRef.current;

    // Calculamos cuántos caracteres deberíamos haber mostrado según el tiempo transcurrido
    const targetIndex = Math.floor(elapsed / speed);

    if (targetIndex > currentIndex && targetIndex <= text.length) {
      setDisplayText(text.slice(0, targetIndex));
      setCurrentIndex(targetIndex);
    }

    if (targetIndex < text.length) {
      requestRef.current = requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  if (children) {
    return <>{children(displayText)}</>;
  }

  return <span>{displayText}</span>;
}
