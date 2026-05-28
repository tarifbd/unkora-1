import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';

export class GenerateLandingPageDto {
  @IsString()
  @MaxLength(300)
  productOrOffer: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetAudience?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  mainGoal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  brandStyle?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sectionsRequired?: string[];
}
