import { IsString, IsOptional, IsNumber, MaxLength, Min, Max } from 'class-validator';

export class GenerateFaqDto {
  @IsString()
  @MaxLength(300)
  topic: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  count?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  audience?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;
}
