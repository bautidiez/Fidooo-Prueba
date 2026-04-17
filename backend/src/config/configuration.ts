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
    privateKey: (process.env.PRIVATE_KEY ?? '')
      .trim()
      .replace(/^['"]+|['"]+$/g, '') // Elimina comillas simples o dobles al inicio/final
      .replace(/\\n/g, '\n'),        // Convierte \n literales en saltos de línea reales
    clientEmail: process.env.CLIENT_EMAIL!,
  },
});
