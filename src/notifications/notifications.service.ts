import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notifications.entity';
import { Ingredient } from '../ingredients/entities/ingredient.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createNotification(
    userId: number,
    ingredientId: number,
    type: 'low_stock' | 'near_expiration' | string,
    message: string,
  ): Promise<any> {
    const notification = this.notificationRepository.create({
      user: { id: userId },
      ingredient: { id: ingredientId },
      type,
      message,
    });
    
    const savedNotification = await this.notificationRepository.save(notification);
    return this.formatNotificationResponse(savedNotification);
  }

  async findByUserId(userId: number, isRead?: boolean): Promise<any[]> {
    const where: any = { user: { id: userId } };
    if (isRead !== undefined) where.isRead = isRead;
    
    const notifications = await this.notificationRepository.find({
      where,
      relations: ['ingredient', 'user'],
      order: { createdAt: 'DESC' },
    });
    
    return notifications.map(this.formatNotificationResponse);
  }

  async markAsRead(id: number, userId: number): Promise<any> {
    const notification = await this.notificationRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user', 'ingredient'],
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found for user ${userId}`);
    }

    notification.isRead = true;
    const updated = await this.notificationRepository.save(notification);
    return this.formatNotificationResponse(updated);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true }
    );
  }

  async delete(id: number, userId: number): Promise<void> {
    const result = await this.notificationRepository.delete({
      id,
      user: { id: userId },
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Notification with ID ${id} not found for user ${userId}`);
    }
  }

  private formatNotificationResponse(notification: Notification): any {
    return {
      id: notification.id,
      userId: notification.user?.id,
      ingredientId: notification.ingredient?.id,
      type: notification.type,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkIngredients() {
    this.logger.log('Checking ingredients for notifications...');
    const now = new Date();
    const expirationThreshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    const ingredients = await this.ingredientRepository.find({
      relations: ['user'],
    });

    for (const ingredient of ingredients) {
      const userId = ingredient.user?.id;
      if (!userId) continue;

      // Verifica estoque baixo
      if (ingredient.minimumStock && ingredient.stock < ingredient.minimumStock) {
        const existing = await this.notificationRepository.findOne({
          where: {
            ingredient: { id: ingredient.id },
            type: 'low_stock',
            isRead: false,
            user: { id: userId },
          },
        });
        
        if (!existing) {
          await this.createNotification(
            userId,
            ingredient.id,
            'low_stock',
            `O Estoque do produto ${ingredient.name} está abaixo do minimo (${ingredient.stock} ${ingredient.unity} < ${ingredient.minimumStock} ${ingredient.unity}).`,
          );
          this.logger.log(`Low stock notification created for ${ingredient.name}`);
        }
      }

      // Verifica data de validade
      if (ingredient.expirationDate) {
        const expirationDate = new Date(ingredient.expirationDate);
        if (expirationDate <= expirationThreshold) {
          const existing = await this.notificationRepository.findOne({
            where: {
              ingredient: { id: ingredient.id },
              type: 'near_expiration',
              isRead: false,
              user: { id: userId },
            },
          });
          
          if (!existing) {
            await this.createNotification(
              userId,
              ingredient.id,
              'near_expiration',
              `A data de validade do produto ${ingredient.name} está se aproxumando (${expirationDate.toLocaleDateString('pt-BR')}).`,
            );
            this.logger.log(`Expiration notification created for ${ingredient.name}`);
          }
        }
      }
    }
  }
}