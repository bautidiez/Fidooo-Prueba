import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import * as admin from 'firebase-admin';

@Controller('auth')
export class AuthController {
  constructor(private readonly firebaseService: FirebaseService) {}

  @Post('check-email')
  async checkEmail(@Body('email') email: string) {
    if (!email) {
      throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
    }

    try {
      // Usamos el admin sdk para buscar al usuario por email
      await admin.auth().getUserByEmail(email);
      return { registered: true };
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return { registered: false };
      }
      // Si es otro error, lo lanzamos
      throw new HttpException(
        'Error checking email status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
