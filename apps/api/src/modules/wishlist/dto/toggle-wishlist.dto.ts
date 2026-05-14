import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ToggleWishlistDto {
  @ApiProperty()
  @IsString()
  productId: string;
}
