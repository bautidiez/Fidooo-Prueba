import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';
import type { MessageRole } from './firestore.types';

export interface NewMessage {
  content: string;
  role: MessageRole;
  userId: string;
}

@Injectable()
export class FirestoreService {
  private readonly logger = new Logger(FirestoreService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async addMessage(message: NewMessage): Promise<void> {
    const { content, role, userId } = message;
    const messagesRef = this.firebaseService.firestore
      .collection('chats')
      .doc(userId)
      .collection('messages');

    await messagesRef.add({
      content,
      role,
      userId,
      createdAt: admin.firestore.Timestamp.now(),
    });

    this.logger.debug(`Message saved [${role}] for user ${userId}`);
  }
}
