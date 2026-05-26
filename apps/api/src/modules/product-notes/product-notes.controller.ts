import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProductNotesService } from './product-notes.service';
import { CreateProductNoteDto } from './dto/create-product-note.dto';

@ApiTags('product-notes')
@Controller('products/:productId/notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class ProductNotesController {
  constructor(private readonly productNotesService: ProductNotesService) {}

  @Get()
  findAll(@Param('productId') productId: string) {
    return this.productNotesService.findByProduct(productId);
  }

  @Post()
  create(@Param('productId') productId: string, @Body() dto: CreateProductNoteDto) {
    return this.productNotesService.create(productId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productNotesService.remove(id);
  }
}
