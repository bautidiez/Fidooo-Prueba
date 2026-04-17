import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import type { AppConfig } from './config/configuration';

/**
 * Punto de entrada principal del Backend Fiboo.
 * 
 * QUÉ: Inicializa el servidor NestJS, configura middlewares globales, CORS y validaciones.
 * POR QUÉ: Es la base de la aplicación donde confluyen todos los módulos y pipes de seguridad.
 * PROBLEMA QUE RESUELVE: Establece un entorno de ejecución seguro y validado para las peticiones del frontend.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const logger = new Logger('Bootstrap');

  // Adaptador para filtros globales de excepciones
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));

  const frontendUrl = configService.get('frontendUrl', { infer: true });
  const port = configService.get('port', { infer: true });

  // --- CONFIGURACIÓN DE SEGURIDAD (CORS) ---
  // IMPORTANTE: Soporta múltiples orígenes si se definen separados por coma en FRONTEND_URL.
  const origins = frontendUrl.split(',').map(u => u.trim()).filter(Boolean);
  
  app.enableCors({
    origin: origins.length > 1 ? origins : origins[0] || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // --- VALIDACIÓN GLOBAL ---
  // Usa ValidationPipe para asegurar que todos los datos entrantes (DTOs) cumplan con los tipos esperados.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  logger.log(`Backend de FibooChat corriendo en puerto: ${port}`);
  logger.log(`Aceptando requests del frontend: ${origins.join(', ')}`);
}
bootstrap();
