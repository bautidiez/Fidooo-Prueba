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
      return '¡Hola! Soy FibooChat. El sistema está funcionando pero todavía no tengo activada mi inteligencia de Google (Gemini).';
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
      this.logger.error(`Error calling Gemini API: ${error?.message}`, error);
      
      throw new InternalServerErrorException(
        `Error al comunicarse con Gemini: ${error?.message || 'Error desconocido'}.`,
      );
    }
  }
}
