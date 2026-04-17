import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/auth.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './chat.dto';

/**
 * Controlador del módulo de Chat.
 * 
 * QUÉ: Define el endpoint /chat para recibir mensajes del usuario.
 * POR QUÉ: Punto de entrada HTTP que requiere autenticación obligatoria.
 * PROBLEMA QUE RESUELVE: Delega la lógica al ChatService tras validar el JWT del usuario.
 */
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
