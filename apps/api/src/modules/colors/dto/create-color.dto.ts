import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateColorDto {
  @IsString()
  name: string;

  @IsString()
  hexCode: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
