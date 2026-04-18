import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import type { AppConfig } from '../src/config/configuration';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    
    cachedApp = await NestFactory.create(AppModule, adapter);
    
    const configService = cachedApp.get(ConfigService);
    const frontendUrl = configService.get('frontendUrl', { infer: true });

    // Enable CORS - Flexible origin to avoid blocking production frontend
    cachedApp.enableCors({
      origin: true, 
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    // Global Filters (Diagnostic)
    cachedApp.useGlobalFilters(new AllExceptionsFilter(cachedApp.get(HttpAdapterHost)));

    // Global Pipes
    cachedApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await cachedApp.init();
  }
  return cachedApp;
}

const handler = async (req: any, res: any) => {
  try {
    const app = await bootstrap();
    const instance = app.getHttpAdapter().getInstance();
    return instance(req, res);
  } catch (err: any) {
    console.error('Fatal bootstrapping error:', err);
    res.status(500).json({
      statusCode: 500,
      message: 'Error al iniciar el servidor de Fiboo. Verificá las variables de entorno en Vercel.',
      error: err.message
    });
  }
};

export default handler;
