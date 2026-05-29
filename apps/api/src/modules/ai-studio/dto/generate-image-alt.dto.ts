import { IsString, IsOptional, MaxLength } from 'class-validator';

export class GenerateImageAltDto {
  @IsString()
  @MaxLength(2000)
  imageUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  context?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  product?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}
