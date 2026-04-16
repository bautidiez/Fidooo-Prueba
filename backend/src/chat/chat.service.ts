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
      this.logger.error(`Falla crítica en Groq: ${e.message}`);
      throw new Error(`Error en Groq (IA): ${e.message}. Verificá tu cuota en console.groq.com`);
    }

    // Guardar respuesta del asistente en Firestore
    try {
      await this.firestoreService.addMessage({
        userId,
        content: reply,
        role: 'assistant',
      });
    } catch (dbError: any) {
      this.logger.error(`Error al guardar en Firestore: ${dbError.message}`, dbError);
      throw new Error(`La IA respondió, pero falló el guardado en la base de datos: ${dbError.message}. Revisá tus credenciales de Firebase en Vercel.`);
    }

    return { reply };
  }
}
