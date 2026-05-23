import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateFlashDealDto {
  @IsString() productId: string;
  @IsNumber() @Min(1) @Max(99) discount: number; // percentage
  @IsDateString() startsAt: string;
  @IsDateString() endsAt: string;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
}
