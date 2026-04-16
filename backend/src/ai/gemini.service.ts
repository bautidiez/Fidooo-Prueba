import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { AppConfig } from '../config/configuration';

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private isMockMode = false;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  onModuleInit(): void {
    const apiKey = this.configService.get('gemini', { infer: true }).apiKey;

    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY no configurada — el sistema podría fallar en producción',
      );
      this.isMockMode = true;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.logger.log('Google Gemini client initialized (gemini-1.5-flash)');
    } catch (error) {
      this.logger.error('Error initializing Gemini AI', error);
      this.isMockMode = true;
    }
  }

  async generateReply(userMessage: string): Promise<string> {
    if (this.isMockMode || !this.model) {
      return '¡Hola! Soy FibooChat. El sistema está funcionando pero el motor de IA no está configurado correctamente o está en modo demo.';
    }

    try {
      const result = await this.model.generateContent(userMessage);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new InternalServerErrorException('Gemini no devolvió contenido.');
      }

      return text;
    } catch (error: any) {
      this.logger.error(`Error calling Gemini API (gemini-1.5-flash): ${error?.message}`, error);
      
      // Intentar fallback a gemini-pro si falla el 1.5
      if (error?.message?.includes('404')) {
        try {
           this.logger.warn('Intentando fallback a modelo alternativo (gemini-pro)...');
           const fallbackModel = this.genAI!.getGenerativeModel({ model: 'gemini-pro' });
           const result = await fallbackModel.generateContent(userMessage);
           const response = await result.response;
           return response.text();
        } catch (fallbackError: any) {
           throw new InternalServerErrorException(
            `Error persistente en Gemini (404). Tu clave de API no tiene acceso a los modelos estándar. Mensaje: ${fallbackError?.message}`
          );
        }
      }

      throw new InternalServerErrorException(
        `Error al comunicarse con Gemini: ${error?.message || 'Error desconocido'}.`,
      );
    }
  }
}
