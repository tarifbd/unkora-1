import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DeliveryBoyStatus } from '@prisma/client';

export class UpdateDeliveryBoyDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsEnum(DeliveryBoyStatus)
  status?: DeliveryBoyStatus;
}
