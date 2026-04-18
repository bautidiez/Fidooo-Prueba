import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { AppConfig } from '../config/configuration';

/**
 * Servicio encargado de la comunicación con Groq AI.
 * 
 * QUÉ: Envía mensajes de usuario a los modelos de Llama hospedados en la infraestructura de Groq.
 * POR QUÉ: Se eligió Groq porque OpenAI bloquea el acceso si no hay un saldo mínimo de USD 5. 
 *          Groq ofrece un tier gratuito generoso y es ideal para MVPs y prototipos rápidos.
 * VENTAJA TÉCNICA: Groq utiliza LPU (Language Processing Units), hardware diseñado específicamente 
 *                   para LLMs que ofrece una velocidad de inferencia (tokens/seg) mucho mayor a la nube tradicional.
 */
@Injectable()
export class GroqService implements OnModuleInit {
  private readonly logger = new Logger(GroqService.name);
  private client: OpenAI | null = null;
  private isMockMode = false;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  /**
   * Inicialización del cliente de Groq.
   * Se ejecuta al arrancar el módulo de NestJS.
   */
  onModuleInit(): void {
    const apiKey = this.configService.get('groq', { infer: true }).apiKey;

    // Si falta la API Key, el servicio entra en modo Mock para evitar errores críticos
    if (!apiKey) {
      this.logger.warn(
        'GROQ_API_KEY no configurada — Fallback a Gemini o Mock',
      );
      this.isMockMode = true;
      return;
    }

    try {
      // Groq utiliza el SDK de OpenAI con un baseURL diferente, facilitando la integración
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

  async generateReply(messages: Array<{ role: string, content: string }>): Promise<string> {
    if (this.isMockMode || !this.client) {
      throw new Error('Groq no está configurado.');
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Sos un asistente inteligente de Fiboo. Respondé siempre en el idioma del usuario de forma útil. Usá Markdown (negrita, cursiva) para resaltar puntos importantes, esto es vital para la legibilidad en móviles.',
          },
          ...messages as any,
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
