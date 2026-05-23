import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDeliveryBoyDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;
}
