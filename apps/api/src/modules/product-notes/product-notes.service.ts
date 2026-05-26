import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductNoteDto } from './dto/create-product-note.dto';

@Injectable()
export class ProductNotesService {
  constructor(private readonly prisma: PrismaService) {}

  findByProduct(productId: string) {
    return this.prisma.productNote.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(productId: string, dto: CreateProductNoteDto) {
    return this.prisma.productNote.create({ data: { productId, ...dto } });
  }

  async remove(id: string) {
    const note = await this.prisma.productNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    return this.prisma.productNote.delete({ where: { id } });
  }
}
