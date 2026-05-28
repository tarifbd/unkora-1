import { IsString, IsOptional, IsArray, IsNumber, MaxLength, Min, Max } from 'class-validator';

export class GenerateBlogDto {
  @IsString()
  @MaxLength(300)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  topic?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tone?: string;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(5000)
  wordCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;
}
