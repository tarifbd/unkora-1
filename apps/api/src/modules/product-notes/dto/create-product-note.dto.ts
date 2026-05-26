import { IsOptional, IsString } from 'class-validator';

export class CreateProductNoteDto {
  @IsString()
  note: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}
