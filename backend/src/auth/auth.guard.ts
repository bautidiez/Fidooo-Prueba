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
   * Método principal de validación del Guard (Lifecycle hook de NestJS).
   * 
   * @param {ExecutionContext} context - Contexto de ejecución de la petición HTTP.
   * @returns {Promise<boolean>} Retorna true si el token es válido, de lo contrario lanza error.
   * 
   * FLUJO PASO A PASO:
   * 1. Obtiene el objeto Request de Express desde el contexto.
   * 2. Llama a extractBearerToken para buscar el JWT en los headers.
   * 3. Si el token no existe, el Guard bloquea la ejecución con un 401 Unauthorized.
   * 4. Usa el Firebase Admin SDK (inyectado vía FirebaseService) para validar la firma.
   * 5. Si la validación es exitosa, decodifica el JSON y lo inyecta en request['user'].
   * 6. Esto permite que los Controllers accedan al UID del usuario logueado de forma segura.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    // Bloqueo inmediato si el token es nulo o malformado
    if (!token) {
      throw new UnauthorizedException('Token de autorización requerido.');
    }

    try {
      // Verificación asíncrona contra los servidores de Google (vía Admin SDK)
      const decodedToken = await this.firebaseService.verifyIdToken(token);
      
      // Adjuntamos el objeto decodificado al request. Es la base de la seguridad del backend.
      request.user = decodedToken;
      return true;
    } catch {
      this.logger.warn('Intento de acceso con Token inválido o expirado detectado');
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
