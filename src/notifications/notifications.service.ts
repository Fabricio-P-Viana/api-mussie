import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
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
    type: 'low_stock' | 'near_expiration',
    message: string,
  ): Promise<any> {
    const notification = this.notificationRepository.create({
      user: { id: userId } as User,
      ingredient: { id: ingredientId } as Ingredient,
      type,
      message,
    });
    const savedNotification = await this.notificationRepository.save(notification);
    return {
      id: savedNotification.id,
      userId: savedNotification.user.id,
      ingredientId: savedNotification.ingredient.id,
      type: savedNotification.type,
      message: savedNotification.message,
      isRead: savedNotification.isRead,
      createdAt: savedNotification.createdAt,
      updatedAt: savedNotification.updatedAt,
    };
  }

  async findByUserId(userId: number, isRead?: boolean): Promise<any[]> {
    const where: any = { user: { id: userId } };
    if (isRead !== undefined) where.isRead = isRead;
    const notifications = await this.notificationRepository.find({
      where,
      relations: ['ingredient', 'user'],
    });
    return notifications.map(notification => ({
      id: notification.id,
      userId: notification.user.id,
      ingredientId: notification.ingredient.id,
      type: notification.type,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }));
  }

  async markAsRead(id: number, userId: number): Promise<any> {
    const notification = await this.notificationRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user', 'ingredient'],
    });

    if (!notification) {
      throw new NotFoundException(`Notificação com ID ${id} não encontrada para o usuário ${userId}`);
    }

    notification.isRead = true;
    const updated = await this.notificationRepository.save(notification);

    return {
      id: updated.id,
      userId: updated.user.id,
      ingredientId: updated.ingredient.id,
      type: updated.type,
      message: updated.message,
      isRead: updated.isRead,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkIngredients() {
    this.logger.log('Verificando ingredientes para notificações...');
    const now = new Date();
    const expirationThreshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias a partir de agora

    // Busca todos os ingredientes com relação ao usuário
    const ingredients = await this.ingredientRepository.find({
      relations: ['user'],
    });

    for (const ingredient of ingredients) {
      const userId = ingredient.user?.id;
      if (!userId) continue;

      // Verifica estoque mínimo
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
            `O estoque de ${ingredient.name} está abaixo do mínimo (${ingredient.stock} ${ingredient.unity} < ${ingredient.minimumStock} ${ingredient.unity}).`,
          );
          this.logger.log(`Notificação de estoque baixo criada para ${ingredient.name}`);
        }
      }

      // Verifica data de validade
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
            `A validade de ${ingredient.name} está próxima (${expirationDate.toLocaleDateString('pt-BR')}).`,
          );
          this.logger.log(`Notificação de validade próxima criada para ${ingredient.name}`);
        }
      }
    }
  }
}