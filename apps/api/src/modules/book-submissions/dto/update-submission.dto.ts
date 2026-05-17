import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookSubmissionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateSubmissionDto {
  @ApiPropertyOptional({ enum: BookSubmissionStatus })
  @IsOptional()
  @IsEnum(BookSubmissionStatus)
  status?: BookSubmissionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNote?: string;
}
