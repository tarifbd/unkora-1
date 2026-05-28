import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';

export class GenerateCategorySeoDto {
  @IsString()
  @MaxLength(200)
  categoryName: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  parentCategory?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetKeywords?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;
}
