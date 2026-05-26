import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateLoyaltyConfigDto {
  @ApiPropertyOptional({ description: 'Points earned per taka spent' })
  @IsOptional()
  @IsInt()
  @Min(1)
  pointsPerTaka?: number;

  @ApiPropertyOptional({ description: 'Taka value per point' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pointValue?: number;

  @ApiPropertyOptional({ description: 'Minimum points to redeem' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minRedeemPoints?: number;

  @ApiPropertyOptional({ description: 'Max % of order total that can be paid with points' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedeemPercent?: number;

  @ApiPropertyOptional({ description: 'Days before points expire (null = never)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  expiryDays?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
