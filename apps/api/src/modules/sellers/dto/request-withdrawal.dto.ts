import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RequestWithdrawalDto {
  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(100, { message: 'Minimum withdrawal amount is ৳100' })
  amount: number;

  @ApiProperty({ example: 'bkash', enum: ['bank', 'bkash', 'nagad', 'rocket'] })
  @IsString()
  @IsIn(['bank', 'bkash', 'nagad', 'rocket'])
  method: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
