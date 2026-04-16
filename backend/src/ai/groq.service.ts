import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { AppConfig } from '../config/configuration';

@Injectable()
export class GroqService implements OnModuleInit {
  private readonly logger = new Logger(GroqService.name);
  private client: OpenAI | null = null;
  private isMockMode = false;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  onModuleInit(): void {
    const apiKey = this.configService.get('groq', { infer: true }).apiKey;

    if (!apiKey) {
      this.logger.warn(
        'GROQ_API_KEY no configurada — Fallback a Gemini o Mock',
      );
      this.isMockMode = true;
      return;
    }

    try {
      this.client = new OpenAI({ 
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      this.logger.log('Groq client initialized (llama-3.1-70b)');
    } catch (error) {
      this.logger.error('Error initializing Groq AI', error);
      this.isMockMode = true;
    }
  }

  async generateReply(userMessage: string): Promise<string> {
    if (this.isMockMode || !this.client) {
      throw new Error('Groq no está configurado.');
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Sos un asistente inteligente de Fiboo. Respondé siempre en el idioma del usuario de forma útil.',
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        max_tokens: 1024,
      });

      const reply = completion.choices[0]?.message?.content;

      if (!reply) {
        throw new InternalServerErrorException('Groq no devolvió contenido.');
      }

      return reply;
    } catch (error: any) {
      this.logger.error(`Error calling Groq API: ${error?.message}`, error);
      throw error;
    }
  }
}
