import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class BookFilterDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1)
  @Transform(({ value }) => parseInt(value as string, 10))
  page?: number = 1;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1)
  @Transform(({ value }) => parseInt(value as string, 10))
  limit?: number = 20;

  @ApiPropertyOptional() @IsOptional() @IsString()
  author?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  publisher?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  language?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  genre?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  series?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  binding?: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber()
  @Transform(({ value }) => parseFloat(value as string))
  minPrice?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber()
  @Transform(({ value }) => parseFloat(value as string))
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ['name', 'basePrice', 'createdAt', 'bookDetail.author'] })
  @IsOptional() @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional() @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
