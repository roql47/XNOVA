import { Controller, Get, Post, Delete, Param, UseGuards, Request, Query, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageService } from './message.service';
import { UserService } from '../user/user.service';

// DTO
class SendMessageDto {
  receiverCoordinate: string;
  title: string;
  content: string;
}

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async getMessages(@Request() req, @Query('limit') limit: number) {
    return this.messageService.getMessages(req.user.userId, limit);
  }

  @Post('send')
  async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    // 발신자 정보 가져오기
    const sender = await this.userService.findById(req.user.userId);
    if (!sender) {
      return { success: false, message: '발신자를 찾을 수 없습니다.' };
    }

    // 수신자 찾기 (좌표로)
    const receiver = await this.userService.findByCoordinate(dto.receiverCoordinate);
    if (!receiver) {
      return { success: false, message: '해당 좌표에 플레이어가 없습니다.' };
    }

    // 자기 자신에게 보내는지 확인
    if (receiver._id.toString() === req.user.userId) {
      return { success: false, message: '자신에게 메시지를 보낼 수 없습니다.' };
    }

    // 제목/내용 검증
    if (!dto.title || dto.title.trim().length === 0) {
      return { success: false, message: '제목을 입력해주세요.' };
    }
    if (!dto.content || dto.content.trim().length === 0) {
      return { success: false, message: '내용을 입력해주세요.' };
    }
    if (dto.title.length > 100) {
      return { success: false, message: '제목은 100자 이하여야 합니다.' };
    }
    if (dto.content.length > 2000) {
      return { success: false, message: '내용은 2000자 이하여야 합니다.' };
    }

    // 메시지 생성
    await this.messageService.createMessage({
      receiverId: receiver._id.toString(),
      senderName: sender.playerName,
      title: dto.title.trim(),
      content: dto.content.trim(),
      type: 'player',
      metadata: {
        senderCoordinate: sender.coordinate,
        senderId: sender._id.toString(),
      },
    });

    return { success: true, message: '메시지를 보냈습니다.' };
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

