import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OpenAiModule } from '../openai/openai.module';
import { FirestoreModule } from '../firestore/firestore.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [OpenAiModule, FirestoreModule, FirebaseModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
