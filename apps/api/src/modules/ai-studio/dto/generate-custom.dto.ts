import { IsString, IsOptional, MaxLength } from 'class-validator';

export class GenerateCustomDto {
  @IsString()
  @MaxLength(4000)
  prompt: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  outputFormat?: string;
}
