import { IsString, IsOptional, IsBoolean, IsEnum, MaxLength } from 'class-validator';

export enum SeoRedirectCodeEnum {
  R301 = 'R301',
  R302 = 'R302',
  R307 = 'R307',
  R308 = 'R308',
}

export class CreateRedirectDto {
  @IsString()
  @MaxLength(500)
  sourcePath: string;

  @IsString()
  @MaxLength(500)
  targetPath: string;

  @IsOptional()
  @IsEnum(SeoRedirectCodeEnum)
  statusCode?: SeoRedirectCodeEnum;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
