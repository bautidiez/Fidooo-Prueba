import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3001),
  FRONTEND_URL: Joi.string().uri().required(),
  OPENAI_API_KEY: Joi.string().optional().allow(''),
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
  firebase: {
    projectId: string;
    privateKey: string;
    clientEmail: string;
  };
}

export const configuration = (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  frontendUrl: process.env.FRONTEND_URL!,
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
  },
  firebase: {
    projectId: process.env.PROJECT_ID!,
    privateKey: (process.env.PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    clientEmail: process.env.CLIENT_EMAIL!,
  },
});
