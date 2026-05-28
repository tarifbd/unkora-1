import { PartialType } from '@nestjs/mapped-types';
import { CreatePreorderConfigDto } from './create-config.dto';

export class UpdatePreorderConfigDto extends PartialType(CreatePreorderConfigDto) {}
