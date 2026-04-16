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
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
      this.logger.log('Google Gemini client initialized (gemini-1.5-flash-latest)');
    } catch (error) {
      this.logger.error('Error initializing Gemini AI', error);
      this.isMockMode = true;
    }
  }

  async generateReply(userMessage: string): Promise<string> {
    const apiKey = this.configService.get('gemini', { infer: true }).apiKey;
    
    // Verificación defensiva del formato de la clave
    if (apiKey && !apiKey.startsWith('AIza')) {
      throw new InternalServerErrorException(
        'La GEMINI_API_KEY configurada en Vercel es inválida. Debe empezar con "AIza". Por favor, generá una nueva en aistudio.google.com'
      );
    }

    if (this.isMockMode || !this.model) {
      return '¡Hola! Soy FibooChat. El sistema está funcionando pero el motor de IA no está configurado correctamente.';
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
