// notifications.controller.ts
import { Controller, Get, Param, Patch, Delete, UseGuards, HttpStatus, Post, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all user notifications' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notifications returned successfully' })
  async findAll(@CurrentUser() user: { userId: number }): Promise<any[]> {
    return this.notificationsService.findByUserId(user.userId);
  }

  @Get('unread')
  @ApiOperation({ summary: 'List unread user notifications' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Unread notifications returned successfully' })
  async findUnread(@CurrentUser() user: { userId: number }): Promise<any[]> {
    return this.notificationsService.findByUserId(user.userId, false);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: number, @CurrentUser() user: { userId: number }): Promise<any> {
    return this.notificationsService.markAsRead(id, user.userId);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: HttpStatus.OK, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user: { userId: number }): Promise<void> {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Notification deleted successfully' })
  async delete(@Param('id') id: number, @CurrentUser() user: { userId: number }): Promise<void> {
    return this.notificationsService.delete(id, user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Notification created successfully' })
  async create(@CurrentUser() user: { userId: number }, @Body() createNotificationDto: CreateNotificationDto): Promise<any> {
    return this.notificationsService.createNotification(
      user.userId,
      createNotificationDto.ingredientId,
      createNotificationDto.type,
      createNotificationDto.message
    );
  }
}