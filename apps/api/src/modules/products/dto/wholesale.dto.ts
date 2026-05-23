import { IsArray, IsNumber, IsPositive, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WholesaleTierDto {
  @IsNumber() @IsPositive() minQty: number;
  @IsNumber() @IsPositive() price: number;
}

export class SetWholesaleDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => WholesaleTierDto) tiers: WholesaleTierDto[];
}
