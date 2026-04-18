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
 * COMPONENTE TYPEWRITER (Efecto Máquina de Escribir)
 * 
 * QUÉ HACE: Renderiza texto de forma secuencial, letra por letra.
 * POR QUÉ EXISTE: Provee el feedback visual de "IA pensando/escribiendo" típico de chatGPT.
 * PROBLEMAS QUE RESUELVE:
 * 1. Estética: Evita que bloques de texto largos aparezcan de golpe.
 * 2. Engagement: Mantiene la atención del usuario mientras se "genera" la respuesta.
 */
export function Typewriter({ text, speed = 40, delay = 0, onComplete, children }: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // EFECTO DE REINICIO: Si el prop 'text' cambia (ej: nueva respuesta), volvemos a empezar desde cero.
  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  // BUCLE DE ANIMACIÓN: Usa un setTimeout recursivo para ir añadiendo caracteres.
  useEffect(() => {
    // Si todavía no hemos llegado al final del texto...
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        // Añadimos el siguiente caracter al estado local
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      // Limpieza del timer para evitar fugas de memoria o colisiones de estado
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      // Notificamos que la animación terminó
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // RENDERIZADO DINÁMICO: Si se provee una función 'children', le pasamos el texto parcial.
  // Esto permite usar ReactMarkdown dentro del Typewriter para renders complejos.
  if (children) {
    return <>{children(displayText)}</>;
  }

  // Fallback a un span simple si no hay lógica de renderizado personalizada
  return <span>{displayText}</span>;
}
