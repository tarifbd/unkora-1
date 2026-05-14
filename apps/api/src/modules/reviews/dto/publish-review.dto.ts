import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class PublishReviewDto {
  @ApiProperty()
  @IsBoolean()
  isPublished: boolean;
}
