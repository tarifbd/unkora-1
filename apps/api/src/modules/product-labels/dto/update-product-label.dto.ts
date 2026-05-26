import { PartialType } from '@nestjs/mapped-types';
import { CreateProductLabelDto } from './create-product-label.dto';

export class UpdateProductLabelDto extends PartialType(CreateProductLabelDto) {}
