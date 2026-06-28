import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
export class ForgotPasswordDto {
  @ApiProperty() @IsEmail() email: string;

  @ApiPropertyOptional({ description: 'reCAPTCHA token (required only when RECAPTCHA_ENABLED=true)' })
  @IsOptional()
  @IsString()
  recaptchaToken?: string;
}
