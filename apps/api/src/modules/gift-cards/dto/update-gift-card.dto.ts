import { ApiPropertyOptional } from '@nestjs/swagger';
import { GiftCardStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateGiftCardDto {
  @ApiPropertyOptional({ enum: GiftCardStatus })
  @IsOptional()
  @IsEnum(GiftCardStatus)
  status?: GiftCardStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
