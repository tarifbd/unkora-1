import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PrepaymentType, PreorderConfigStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreatePreorderConfigDto {
  @IsString()
  productId: string;

  @IsOptional() @IsString()
  variantId?: string;

  @IsOptional() @IsBoolean()
  isEnabled?: boolean;

  @IsOptional() @IsString()
  preorderTitle?: string;

  @IsOptional() @IsString()
  preorderDescription?: string;

  @IsOptional() @IsDateString()
  expectedReleaseDate?: string;

  @IsOptional() @IsDateString()
  expectedDeliveryStart?: string;

  @IsOptional() @IsDateString()
  expectedDeliveryEnd?: string;

  @IsOptional() @IsDateString()
  preorderStartDate?: string;

  @IsOptional() @IsDateString()
  preorderEndDate?: string;

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  stockLimit?: number;

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  maxQtyPerCustomer?: number;

  @IsOptional() @IsBoolean()
  prepaymentRequired?: boolean;

  @IsOptional() @IsEnum(PrepaymentType)
  prepaymentType?: PrepaymentType;

  @IsOptional() @Type(() => Number)
  prepaymentAmount?: number;

  @IsOptional() @Type(() => Number)
  preorderPrice?: number;

  @IsOptional() @IsBoolean()
  allowCancellation?: boolean;

  @IsOptional() @IsDateString()
  cancellationDeadline?: string;

  @IsOptional() @IsBoolean()
  autoConvertToOrder?: boolean;

  @IsOptional() @IsEnum(PreorderConfigStatus)
  status?: PreorderConfigStatus;
}
