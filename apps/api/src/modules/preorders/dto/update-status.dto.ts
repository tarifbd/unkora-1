import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PreorderOrderStatus } from '@prisma/client';

export class UpdatePreorderStatusDto {
  @IsEnum(PreorderOrderStatus)
  status: PreorderOrderStatus;

  @IsOptional() @IsString()
  note?: string;
}
