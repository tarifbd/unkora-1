import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PlacePreorderDto {
  @IsString()
  configId: string;

  @IsInt() @Min(1) @Type(() => Number)
  quantity: number;

  @IsString()
  customerName: string;

  @IsOptional() @IsString()
  customerEmail?: string;

  @IsString()
  customerPhone: string;

  @IsOptional()
  shippingAddress?: Record<string, unknown>;

  @IsOptional() @IsString()
  note?: string;
}
