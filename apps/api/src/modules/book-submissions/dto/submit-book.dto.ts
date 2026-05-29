import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
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
  @Min(1)
  suggestedPrice: number;

  /** EBOOK | PHYSICAL | BOTH */
  @ApiProperty({ enum: ['EBOOK', 'PHYSICAL', 'BOTH'], default: 'PHYSICAL' })
  @IsString()
  @IsIn(['EBOOK', 'PHYSICAL', 'BOTH'])
  bookType: 'EBOOK' | 'PHYSICAL' | 'BOTH';

  /** URL to digital file (PDF/EPUB) for e-books */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  digitalFileUrl?: string;

  /** Author biography */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorBio?: string;

  /** Sample chapter URL or text */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sampleUrl?: string;

  /** Royalty rate requested by author (admin will set final) */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(5)
  @Type(() => Number)
  requestedRoyaltyPercent?: number;
}
