import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../ai/gemini.service';
import { FirestoreService } from '../firestore/firestore.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly aiService: GeminiService,
    private readonly firestoreService: FirestoreService,
  ) {}

  async processMessage(userId: string, message: string): Promise<{ reply: string }> {
    this.logger.debug(`Procesando mensaje de usuario: ${userId}`);

    // Call Gemini for free AI response
    const reply = await this.aiService.generateReply(message);

    // Save Assistant reply to Firestore
    await this.firestoreService.addMessage({
      userId,
      content: reply,
      role: 'assistant',
    });

    return { reply };
  }
}
