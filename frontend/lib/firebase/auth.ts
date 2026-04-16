import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  type UserCredential,
  type Auth,
} from 'firebase/auth';
import { app } from './config';

const auth: Auth = getAuth(app);

export { auth };

export const FIREBASE_AUTH_ERRORS: Record<string, string> = {
  'auth/user-not-found': 'No existe una cuenta con ese email.',
  'auth/wrong-password': 'Contraseña incorrecta. Intentá de nuevo.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ese email ya está registrado.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'El email no tiene un formato válido.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá un momento e intentá de nuevo.',
  'auth/network-request-failed': 'Error de red. Verificá tu conexión a internet.',
};

export function getFirebaseErrorMessage(code: string): string {
  return FIREBASE_AUTH_ERRORS[code] ?? `Error: ${code}`;
}

export async function signIn(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOutUser(): Promise<void> {
  return signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://fidooo-prueba.vercel.app/api';
  
  try {
    console.log(`Checking email existence at: ${backendUrl}/auth/check-email`);
    const response = await fetch(`${backendUrl}/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    console.log(`Backend response status: ${response.status}`);

    if (!response.ok) {
      console.warn('Backend verification failed or not found. Falling back to default behavior.');
      return true; 
    }

    const data = await response.json();
    console.log('Backend verification result:', data);
    return data.registered === true;
  } catch (error) {
    console.error('Error connecting to backend for email check:', error);
    return true; 
  }
}

export async function signInWithGoogle(): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export { sendEmailVerification };
