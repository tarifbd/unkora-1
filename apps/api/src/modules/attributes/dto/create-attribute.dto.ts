import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateAttributeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];
}
