import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/auth.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './chat.dto';

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(
    @CurrentUser() user: DecodedIdToken,
    @Body() dto: SendMessageDto,
  ): Promise<{ reply: string }> {
    return this.chatService.processMessage(user.uid, dto.message, dto.conversationId);
  }
}
