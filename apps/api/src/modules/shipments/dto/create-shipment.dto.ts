import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateShipmentDto {
  @IsString()
  orderId: string;

  @IsString()
  courier: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @IsOptional()
  @IsDateString()
  estimatedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
