/**
 * Configuración central de Firebase para el cliente.
 * 
 * QUÉ: Inicializa la conexión con los servicios de Firebase (Auth, Firestore, etc).
 * POR QUÉ: Centraliza las credenciales y permite exportar una instancia única (Singleton).
 * PROBLEMA QUE RESUELVE: Evita errores de re-inicialización en el entorno de desarrollo de Next.js.
 */
import { getApps, initializeApp, getApp, type FirebaseApp } from 'firebase/app';

const isBrowser = typeof window !== 'undefined';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export { app };
