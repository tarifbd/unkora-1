import { IsString, IsOptional, MaxLength } from 'class-validator';

export class GenerateAdCopyDto {
  @IsString()
  @MaxLength(200)
  product: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  audience?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  usp?: string;
}
