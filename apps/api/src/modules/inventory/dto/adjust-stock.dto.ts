import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { StockMovementType } from '@prisma/client';

export class AdjustStockDto {
  @IsString()
  productId: string;

  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsInt()
  quantity: number; // positive = add, negative = remove

  @IsOptional()
  @IsString()
  note?: string;
}
