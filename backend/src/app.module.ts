import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration, validationSchema } from './config/configuration';
import { FirebaseModule } from './firebase/firebase.module';
import { ChatModule } from './chat/chat.module';
import { AppController } from './app.controller';
import { AuthController } from './auth/auth.controller';

/**
 * Módulo raíz de la aplicación NestJS.
 * 
 * QUÉ: Orquesta la inyección de dependencias de todos los módulos del backend.
 * POR QUÉ: Permite una estructura modular y escalable.
 * CARACTERÍSTICA: Centraliza la configuración global del entorno (ConfigModule).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    FirebaseModule,
    ChatModule,
  ],
  controllers: [AppController, AuthController],
})
export class AppModule {}
