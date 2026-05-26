import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateProductLabelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  bgColor?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
