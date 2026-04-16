import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../ai/gemini.service';
import { GroqService } from '../ai/groq.service';
import { FirestoreService } from '../firestore/firestore.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly groqService: GroqService,
    private readonly firestoreService: FirestoreService,
  ) {}

  async processMessage(userId: string, message: string): Promise<{ reply: string }> {
    this.logger.debug(`Procesando mensaje de usuario: ${userId}`);
    let reply: string | null = null;
    let errorLog = '';

    // 1. Intentar con Groq (El más estable gratis)
    try {
      reply = await this.groqService.generateReply(message);
      this.logger.log('Respuesta generada con Groq');
    } catch (e: any) {
      this.logger.warn(`Falla en Groq: ${e.message}`);
      errorLog += `Groq: ${e.message}. `;
    }

    // 2. Fallback a Gemini si Groq falló o no tiene clave
    if (!reply) {
      try {
        reply = await this.geminiService.generateReply(message);
        this.logger.log('Respuesta generada con Gemini');
      } catch (e: any) {
        this.logger.warn(`Falla en Gemini: ${e.message}`);
        errorLog += `Gemini: ${e.message}. `;
      }
    }

    // 3. Fallo total
    if (!reply) {
      throw new Error(`No se pudo conectar con ninguna IA (Groq/Gemini). Detalles: ${errorLog}`);
    }

    // Guardar respuesta del asistente en Firestore
    await this.firestoreService.addMessage({
      userId,
      content: reply,
      role: 'assistant',
    });

    return { reply };
  }
}
