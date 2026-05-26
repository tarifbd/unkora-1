import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateSizeGuideDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
