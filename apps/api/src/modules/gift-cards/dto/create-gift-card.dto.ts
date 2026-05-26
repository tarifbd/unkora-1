import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateGiftCardDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
