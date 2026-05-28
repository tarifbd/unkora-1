import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class AiSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  defaultModel?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(32000)
  maxTokens?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  systemPrompt?: string;

  @IsOptional()
  @IsBoolean()
  safetyMode?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  monthlyTokenLimit?: number;
}
