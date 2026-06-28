import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and a number',
  })
  password: string;

  @ApiProperty({ example: 'Rafiq' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Islam' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiPropertyOptional({ example: '+8801700000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'reCAPTCHA token (required only when RECAPTCHA_ENABLED=true)' })
  @IsOptional()
  @IsString()
  recaptchaToken?: string;
}
