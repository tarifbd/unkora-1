import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { RefundReason } from '@prisma/client';

export class CreateRefundDto {
  @IsString() orderId: string;
  @IsNumber() @IsPositive() amount: number;
  @IsEnum(RefundReason) reason: RefundReason;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}
