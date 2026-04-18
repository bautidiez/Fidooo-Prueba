import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';
import type { MessageRole } from './firestore.types';

export interface NewMessage {
  content: string;
  role: MessageRole;
  userId: string;
  conversationId: string;
}

/**
 * Servicio para la persistencia de datos en Firestore.
 * 
 * QUÉ: Gatekeeper para todas las operaciones de escritura en la base de datos de Firebase.
 * POR QUÉ: Centraliza el acceso a Firestore usando el Admin SDK (bypass de reglas de seguridad locales).
 * MODELO DE DATOS: Estructura jerárquica para escalabilidad y seguridad por usuario:
 * chats (col) -> userId (doc) -> conversations (col) -> convID (doc) -> messages (col)
 */
@Injectable()
export class FirestoreService {
  private readonly logger = new Logger(FirestoreService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Registra un nuevo mensaje en una conversación específica.
   * 
   * Flujo:
   * 1. Navega por la jerarquía de colecciones hasta la conversación del usuario.
   * 2. Agrega el documento del mensaje con su timestamp.
   * 3. Actualiza el metadato 'updatedAt' de la conversación para ordenamiento en el sidebar.
   * 
   * @param {NewMessage} message - Datos del mensaje a guardar.
   */
  async addMessage(message: NewMessage): Promise<void> {
    const { content, role, userId, conversationId } = message;
    
    // --- Referencia a la subcolección de mensajes del usuario ---
    const messagesRef = this.firebaseService.firestore
      .collection('chats')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId)
      .collection('messages');

    // --- Inserción del mensaje ---
    await messagesRef.add({
      content,
      role,
      userId,
      createdAt: admin.firestore.Timestamp.now(), // Timestamp del servidor para orden cronológico
    });

    // --- Actualización de metadatos de la conversación ---
    const conversationRef = this.firebaseService.firestore
      .collection('chats')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId);

    // Usamos merge: true para no borrar otros campos (como el título) si existieran
    await conversationRef.set({
      updatedAt: admin.firestore.Timestamp.now(),
    }, { merge: true });

    this.logger.debug(`Mensaje guardado [${role}] en la conversación ${conversationId}`);
  }

  /**
   * Obtiene los últimos mensajes de una conversación para dar contexto a la IA.
   * 
   * @param {string} userId - ID del usuario.
   * @param {string} conversationId - ID de la conversación.
   * @param {number} limit - Cantidad máxima de mensajes a recuperar.
   * @returns {Promise<any[]>} Lista de mensajes formateados.
   */
  async getMessages(userId: string, conversationId: string, limit: number = 10): Promise<any[]> {
    const messagesRef = this.firebaseService.firestore
      .collection('chats')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId)
      .collection('messages');

    const snapshot = await messagesRef
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    // Revertimos el orden para que lleguen cronológicamente (más antiguo primero) a la IA
    return snapshot.docs
      .map(doc => doc.data())
      .reverse();
  }
}
