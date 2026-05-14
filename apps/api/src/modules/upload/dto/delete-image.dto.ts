import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteImageDto {
  @ApiProperty({ description: 'The public URL of the image to delete (e.g. /uploads/filename.jpg)' })
  @IsString()
  url: string;
}
