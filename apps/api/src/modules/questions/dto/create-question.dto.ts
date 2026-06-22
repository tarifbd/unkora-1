import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty()
  @IsString()
  @MinLength(10)
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guestName?: string;
}
