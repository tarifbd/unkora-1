import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class SubmitBookDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  authorName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publisherName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiProperty({ default: 'Bengali' })
  @IsString()
  language: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pageCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  edition?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  genres: string[];

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  suggestedPrice: number;
}
