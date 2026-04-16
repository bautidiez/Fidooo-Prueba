import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { AppConfig } from '../config/configuration';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app!: admin.app.App;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  onModuleInit(): void {
    const firebase = this.configService.get('firebase', { infer: true });

    if (admin.apps.length === 0) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebase.projectId,
          privateKey: firebase.privateKey,
          clientEmail: firebase.clientEmail,
        }),
      });
      this.logger.log('Firebase Admin SDK initialized');
    } else {
      this.app = admin.apps[0]!;
    }
  }

  get firestore(): admin.firestore.Firestore {
    return this.app.firestore();
  }

  async verifyIdToken(token: string): Promise<DecodedIdToken> {
    return this.app.auth().verifyIdToken(token);
  }
}
