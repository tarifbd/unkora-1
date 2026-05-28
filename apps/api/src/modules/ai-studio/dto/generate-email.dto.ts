import { IsString, IsOptional, MaxLength } from 'class-validator';

export class GenerateEmailDto {
  @IsString()
  @MaxLength(100)
  emailType: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  product?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  audience?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tone?: string;
}
