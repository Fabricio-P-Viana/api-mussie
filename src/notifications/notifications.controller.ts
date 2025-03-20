import { Controller, Get, Param, Patch, UseGuards, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Assumindo que existe
import { NotificationsService } from './notifications.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator'; 

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as notificações do usuário' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notificações retornadas com sucesso' })
  async findAll(@CurrentUser() user: { userId: number; email: string }): Promise<any[]> {
    return this.notificationsService.findByUserId(user.userId);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Lista notificações não lidas do usuário' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notificações não lidas retornadas com sucesso' })
  async findUnread(@CurrentUser() user: { userId: number; email: string }): Promise<any[]> {
    return this.notificationsService.findByUserId(user.userId, false);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marca uma notificação como lida' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notificação marcada como lida' })
  async markAsRead(@Param('id') id: number, @CurrentUser() user: { userId: number; email: string }): Promise<any> {
    return this.notificationsService.markAsRead(id, user.userId);
  }
}