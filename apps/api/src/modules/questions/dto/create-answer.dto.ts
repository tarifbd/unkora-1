import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateAnswerDto {
  @ApiProperty()
  @IsString()
  @MinLength(5)
  body: string;
}
