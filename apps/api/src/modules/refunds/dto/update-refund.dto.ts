import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RefundStatus } from '@prisma/client';

export class UpdateRefundDto {
  @IsEnum(RefundStatus) status: RefundStatus;
  @IsOptional() @IsString() adminNote?: string;
}
