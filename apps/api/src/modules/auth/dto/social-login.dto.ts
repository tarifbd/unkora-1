import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PhoneLoginDto {
  @ApiProperty({ example: '01711000000' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9+]{6,20}$/, { message: 'phone must be a valid phone number' })
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  code: string;
}

export class GoogleLoginDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class FacebookLoginDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
