import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateFaqDto {
  @IsString()
  @MinLength(3)
  question: string;

  @IsString()
  @MinLength(3)
  answer: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
