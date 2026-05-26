import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class AdjustPointsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Positive to add, negative to deduct' })
  @IsInt()
  points: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
