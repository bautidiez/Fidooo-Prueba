import { Injectable, Logger } from '@nestjs/common';
import { OpenAiService } from '../openai/openai.service';
import { FirestoreService } from '../firestore/firestore.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly openAiService: OpenAiService,
    private readonly firestoreService: FirestoreService,
  ) {}

  async processMessage(userId: string, message: string): Promise<{ reply: string }> {
    this.logger.debug(`Procesando mensaje de usuario: ${userId}`);

    // Call OpenAI directly (or use Mock if no key)
    const reply = await this.openAiService.generateReply(message);

    // Save Assistant reply to Firestore
    await this.firestoreService.addMessage({
      userId,
      content: reply,
      role: 'assistant',
    });

    return { reply };
  }
}
