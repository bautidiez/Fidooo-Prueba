import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';
import type { MessageRole } from './firestore.types';

export interface NewMessage {
  content: string;
  role: MessageRole;
  userId: string;
  conversationId: string;
}

@Injectable()
export class FirestoreService {
  private readonly logger = new Logger(FirestoreService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async addMessage(message: NewMessage): Promise<void> {
    const { content, role, userId, conversationId } = message;
    
    // 1. Reference to the specific conversation messages
    const messagesRef = this.firebaseService.firestore
      .collection('chats')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId)
      .collection('messages');

    // 2. Add the message
    await messagesRef.add({
      content,
      role,
      userId,
      createdAt: admin.firestore.Timestamp.now(),
    });

    // 3. Update conversation metadata (last update and title if first message)
    // For titles, we can do it on the frontend or here. For now, just touch updatedAt.
    const conversationRef = this.firebaseService.firestore
      .collection('chats')
      .doc(userId)
      .collection('conversations')
      .doc(conversationId);

    await conversationRef.set({
      updatedAt: admin.firestore.Timestamp.now(),
    }, { merge: true });

    this.logger.debug(`Message saved [${role}] in conv ${conversationId} for user ${userId}`);
  }
}
