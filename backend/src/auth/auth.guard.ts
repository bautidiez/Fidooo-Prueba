import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseService } from '../firebase/firebase.service';

export interface AuthenticatedRequest extends Request {
  user: DecodedIdToken;
}

/**
 * Guard de NestJS para proteger rutas mediante Firebase Authentication.
 * 
 * QUÉ: Verifica que la petición contenga un ID Token de Firebase válido en el header Authorization.
 * POR QUÉ: Asegura que solo usuarios autenticados puedan acceder a endpoints sensibles del backend.
 * PROBLEMA QUE RESUELVE: Centraliza la validación de identidad y previene accesos no autorizados.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Método principal de validación del Guard.
   * 
   * Flujo de validación:
   * 1. Extrae el token del header (Bearer Token).
   * 2. Si no hay token, lanza UnauthorizedException (401).
   * 3. Llama a Firebase Admin para verificar la firma y expiración del JWT.
   * 4. Si es válido, inyecta el usuario decodificado en la petición (`request.user`) para uso posterior.
   * 5. Retorna true para permitir el acceso al controlador.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    // Bloqueo inmediato si falta el token
    if (!token) {
      throw new UnauthorizedException('Token de autorización requerido.');
    }

    try {
      // Verificación externa con Firebase Admin SDK
      const decodedToken = await this.firebaseService.verifyIdToken(token);
      
      // Adjuntar datos del usuario al request para controllers
      request.user = decodedToken;
      return true;
    } catch {
      this.logger.warn('Token de Firebase inválido o expirado');
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }

  /**
   * Extrae el token JWT del string "Bearer <token>".
   */
  private extractBearerToken(request: Request): string | null {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) return null;
    return authorization.slice(7);
  }
}
