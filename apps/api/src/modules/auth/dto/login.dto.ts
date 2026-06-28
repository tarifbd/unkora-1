import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ description: 'reCAPTCHA token (required only when RECAPTCHA_ENABLED=true)' })
  @IsOptional()
  @IsString()
  recaptchaToken?: string;
}
