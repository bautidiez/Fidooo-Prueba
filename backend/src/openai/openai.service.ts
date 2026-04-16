import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { AppConfig } from '../config/configuration';

const MOCK_RESPONSES = [
  '¡Hola! Soy FibooChat en modo demo. Configurá tu OPENAI_API_KEY para habilitar ChatGPT real. 🤖',
  'Modo de prueba activo. Tus mensajes se guardan en Firestore correctamente. ✅',
  'El sistema funciona perfecto. Solo falta la API key de OpenAI para respuestas reales. 🚀',
];

@Injectable()
export class OpenAiService implements OnModuleInit {
  private readonly logger = new Logger(OpenAiService.name);
  private client: OpenAI | null = null;
  private isMockMode = false;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  onModuleInit(): void {
    const apiKey = this.configService.get('openai', { infer: true }).apiKey;

    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY no configurada — usando modo mock (respuestas simuladas)',
      );
      this.isMockMode = true;
      return;
    }

    this.client = new OpenAI({ apiKey });
    this.logger.log('OpenAI client initialized (gpt-4o-mini)');
  }

  async generateReply(userMessage: string): Promise<string> {
    if (this.isMockMode || !this.client) {
      return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]!;
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Sos un asistente inteligente y amigable. Respondé siempre en el idioma del usuario. Sé conciso pero útil.',
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      });

      const reply = completion.choices[0]?.message?.content;

      if (!reply) {
        throw new InternalServerErrorException('OpenAI no devolvió contenido.');
      }

      return reply;
    } catch (error: any) {
      if (error instanceof InternalServerErrorException) throw error;

      const errorMessage = error?.message || 'Error desconocido';
      this.logger.error(`Error calling OpenAI API: ${errorMessage}`, error);
      
      throw new InternalServerErrorException(
        `Error OpenAI: ${errorMessage}. Revisá tu API Key y saldo en platform.openai.com`,
      );
    }
  }
}
