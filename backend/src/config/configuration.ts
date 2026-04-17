import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3001),
  FRONTEND_URL: Joi.string().required(), // Eliminamos .uri() para permitir limpieza manual si es necesario
  OPENAI_API_KEY: Joi.string().optional().allow(''),
  GEMINI_API_KEY: Joi.string().optional().allow(''),
  GROQ_API_KEY: Joi.string().optional().allow(''),
  PROJECT_ID: Joi.string().required(),
  PRIVATE_KEY: Joi.string().required(),
  CLIENT_EMAIL: Joi.string().email().required(),
});

export interface AppConfig {
  port: number;
  frontendUrl: string;
  openai: {
    apiKey: string;
  };
  gemini: {
    apiKey: string;
  };
  groq: {
    apiKey: string;
  };
  firebase: {
    projectId: string;
    privateKey: string;
    clientEmail: string;
  };
}

export const configuration = (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  frontendUrl: (process.env.FRONTEND_URL ?? '').trim(),
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY ?? '',
  },
  firebase: {
    projectId: process.env.PROJECT_ID!,
    /**
     * PROCESAMIENTO QUIRÚRGICO DE LA PRIVATE_KEY:
     * El private key de Firebase suele venir con saltos de línea y a veces envuelto en comillas.
     * Al configurarlo en Vercel, estos caracteres pueden corromperse (ej: \n como texto literal).
     * 1. .trim(): Elimina espacios accidentales.
     * 2. .replace(/^['"]+|['"]+$/g, ''): Remueve comillas envolventes opcionales.
     * 3. .replace(/\\n/g, '\n'): Convierte la cadena "\n" en un salto de línea real (\n) para que el parser lo reconozca.
     */
    privateKey: (process.env.PRIVATE_KEY ?? '')
      .trim()
      .replace(/^['"]+|['"]+$/g, '') 
      .replace(/\\n/g, '\n'),
    clientEmail: process.env.CLIENT_EMAIL!,
  },
});
