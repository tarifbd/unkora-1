import { PartialType } from '@nestjs/mapped-types';
import { CreateSmartBarDto } from './create-smart-bar.dto';

export class UpdateSmartBarDto extends PartialType(CreateSmartBarDto) {}
