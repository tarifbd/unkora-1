import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CmsPageStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { CreateFaqDto } from './dto/create-faq.dto';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Pages ──────────────────────────────────────────────────

  async findAllPages(limit = 50, offset = 0) {
    const [data, total] = await Promise.all([
      this.prisma.cmsPage.findMany({ orderBy: { updatedAt: 'desc' }, take: limit, skip: offset }),
      this.prisma.cmsPage.count(),
    ]);
    return { data, total };
  }

  async findPageBySlug(slug: string, publicOnly = false) {
    const where = publicOnly
      ? { slug, status: CmsPageStatus.PUBLISHED }
      : { slug };
    const page = await this.prisma.cmsPage.findFirst({ where });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async findPageById(id: string) {
    const page = await this.prisma.cmsPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async createPage(dto: CreatePageDto) {
    const existing = await this.prisma.cmsPage.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`A page with slug "${dto.slug}" already exists`);
    return this.prisma.cmsPage.create({ data: { ...dto } });
  }

  async updatePage(id: string, dto: UpdatePageDto) {
    await this.findPageById(id);
    if (dto.slug) {
      const conflict = await this.prisma.cmsPage.findFirst({ where: { slug: dto.slug, NOT: { id } } });
      if (conflict) throw new ConflictException(`Slug "${dto.slug}" is already used`);
    }
    return this.prisma.cmsPage.update({ where: { id }, data: { ...dto } });
  }

  async deletePage(id: string) {
    await this.findPageById(id);
    await this.prisma.cmsPage.delete({ where: { id } });
    return { success: true };
  }

  async upsertPageBySlug(slug: string, dto: Omit<UpdatePageDto, 'slug'>) {
    return this.prisma.cmsPage.upsert({
      where: { slug },
      create: { slug, title: dto.title ?? slug, content: dto.content ?? '', ...dto },
      update: { ...dto },
    });
  }

  // ── FAQs ───────────────────────────────────────────────────

  async findAllFaqs() {
    return this.prisma.cmsFaq.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  }

  async createFaq(dto: CreateFaqDto) {
    return this.prisma.cmsFaq.create({ data: dto });
  }

  async updateFaq(id: string, dto: Partial<CreateFaqDto>) {
    const faq = await this.prisma.cmsFaq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ not found');
    return this.prisma.cmsFaq.update({ where: { id }, data: dto });
  }

  async deleteFaq(id: string) {
    const faq = await this.prisma.cmsFaq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ not found');
    await this.prisma.cmsFaq.delete({ where: { id } });
    return { success: true };
  }

  async reorderFaqs(ids: string[]) {
    await Promise.all(ids.map((id, idx) => this.prisma.cmsFaq.update({ where: { id }, data: { sortOrder: idx } })));
    return this.findAllFaqs();
  }
}
