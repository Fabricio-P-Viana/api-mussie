// create-notification.dto.ts
import { IsNumber, IsString, IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID of the related ingredient' })
  @IsNumber()
  @IsNotEmpty()
  ingredientId: number;

  @ApiProperty({ enum: ['low_stock', 'near_expiration', 'other'], description: 'Type of notification' })
  @IsString()
  @IsIn(['low_stock', 'near_expiration', 'other'])
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Notification message content' })
  @IsString()
  @IsNotEmpty()
  message: string;
}