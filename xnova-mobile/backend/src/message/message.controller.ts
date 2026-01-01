import { Controller, Get, Post, Delete, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageService } from './message.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  async getMessages(@Request() req, @Query('limit') limit: number) {
    return this.messageService.getMessages(req.user.userId, limit);
  }

  @Post(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    return this.messageService.markAsRead(id, req.user.userId);
  }

  @Delete(':id')
  async deleteMessage(@Request() req, @Param('id') id: string) {
    return this.messageService.deleteMessage(id, req.user.userId);
  }
}

