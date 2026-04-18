import { Injectable, Logger } from '@nestjs/common';
import { GroqService } from '../ai/groq.service';
import { FirestoreService } from '../firestore/firestore.service';

/**
 * Orquestador de la lógica de chat.
 * 
 * QUÉ: Recibe el mensaje, pide respuesta a la IA y la persiste.
 * POR QUÉ: Desacopla la lógica de negocio del controlador HTTP.
 * PROBLEMA QUE RESUELVE: Garantiza que la respuesta de la IA se guarde antes de confirmar al usuario.
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly groqService: GroqService,
    private readonly firestoreService: FirestoreService,
  ) {}

    /**
   * Procesa un mensaje entrante, genera una respuesta inteligente y la guarda.
   * 
   * @param {string} userId - ID del usuario autor del mensaje.
   * @param {string} message - Texto del mensaje enviado.
   * @param {string} conversationId - ID de la conversación para agrupar mensajes.
   * @returns {Promise<{ reply: string }>} Objeto con el contenido de la respuesta.
   */
  async processMessage(userId: string, message: string, conversationId: string): Promise<{ reply: string }> {
    this.logger.debug(`Procesando mensaje en conv: ${conversationId} de usuario: ${userId}`);
    let reply: string | null = null;

    // 1. Obtener historial previo para dar memoria a la IA
    const history = await this.firestoreService.getMessages(userId, conversationId, 10);
    
    // Mapeamos al formato que espera Groq (OpenAI Compatible)
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Añadimos el mensaje actual del usuario al contexto
    formattedHistory.push({ role: 'user', content: message });

    // 2. Intentar con Groq enviando todo el contexto
    try {
      reply = await this.groqService.generateReply(formattedHistory);
      this.logger.log('Respuesta generada con Groq (con memoria)');
    } catch (e: any) {
      this.logger.error(`Falla crítica en Groq: ${e.message}`);
      throw new Error(`Error en Groq (IA): ${e.message}. Verificá tu cuota.`);
    }

    // 2. Persistir respuesta del asistente en Firestore
    // Nota: El frontend detectará este cambio gracias al listener onSnapshot y lo mostrará solo.
    try {
      await this.firestoreService.addMessage({
        userId,
        content: reply,
        role: 'assistant',
        conversationId,
      });
    } catch (dbError: any) {
      this.logger.error(`Error al guardar en Firestore: ${dbError.message}`, dbError);
      throw new Error(`La IA respondió, pero no se pudo persistir el mensaje.`);
    }

    return { reply };
  }
}
