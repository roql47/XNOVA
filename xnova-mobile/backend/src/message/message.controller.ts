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

class BroadcastMessageDto {
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

  // 관리자 권한 확인
  @Get('admin/check')
  async checkAdmin(@Request() req) {
    const isAdmin = await this.messageService.isAdmin(req.user.userId);
    return { isAdmin };
  }

  // 전체 메시지 발송 (관리자 전용)
  @Post('broadcast')
  async broadcastMessage(@Request() req, @Body() dto: BroadcastMessageDto) {
    console.log('Broadcast request received:', { userId: req.user.userId, dto });
    
    try {
      // 관리자 권한 확인
      const isAdmin = await this.messageService.isAdmin(req.user.userId);
      console.log('isAdmin check:', isAdmin);
      if (!isAdmin) {
        return { success: false, message: '관리자 권한이 필요합니다.' };
      }

      // 발신자 정보 가져오기
      const sender = await this.userService.findById(req.user.userId);
      console.log('sender:', sender?.playerName);
      if (!sender) {
        return { success: false, message: '발신자를 찾을 수 없습니다.' };
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

      // 전체 메시지 발송
      console.log('Sending broadcast message...');
      const result = await this.messageService.broadcastMessage({
        senderId: req.user.userId,
        senderName: sender.playerName,
        title: dto.title.trim(),
        content: dto.content.trim(),
      });
      console.log('Broadcast result:', result);

      return { 
        success: true, 
        message: `${result.count}명에게 공지를 발송했습니다.`,
        count: result.count,
      };
    } catch (error) {
      console.error('Broadcast error:', error);
      return { success: false, message: `서버 오류: ${error.message}` };
    }
  }
}

