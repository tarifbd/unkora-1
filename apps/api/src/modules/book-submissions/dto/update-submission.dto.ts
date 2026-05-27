import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookSubmissionStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSubmissionDto {
  @ApiPropertyOptional({ enum: BookSubmissionStatus })
  @IsOptional()
  @IsEnum(BookSubmissionStatus)
  status?: BookSubmissionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNote?: string;

  /** Override royalty percent when approving */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  @Type(() => Number)
  royaltyPercent?: number;

  /** Override price when approving */
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  finalPrice?: number;

  /** Category ID when creating product */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;
}
