import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface CsvProductRow {
  name: string;
  slug?: string;
  description?: string;
  shortDesc?: string;
  sku: string;
  basePrice: string;
  salePrice?: string;
  stockQuantity?: string;
  categoryName?: string;
  brandName?: string;
  tags?: string;
  isActive?: string;
  weight?: string;
  metaTitle?: string;
  metaDesc?: string;
}

@Injectable()
export class CsvImportService {
  constructor(private readonly prisma: PrismaService) {}

  parseCsv(content: string): CsvProductRow[] {
    const lines = content.split('\n').filter(l => l.trim());
    if (!lines.length) throw new BadRequestException('CSV file is empty');

    const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'));

    // Map common header aliases
    const headerMap: Record<string, string> = {
      'product_name': 'name', 'title': 'name', 'item_name': 'name',
      'item_sku': 'sku', 'product_sku': 'sku',
      'price': 'baseprice', 'base_price': 'baseprice', 'regular_price': 'baseprice',
      'sale_price': 'saleprice', 'discounted_price': 'saleprice',
      'qty': 'stockquantity', 'quantity': 'stockquantity', 'stock': 'stockquantity',
      'category': 'categoryname', 'category_name': 'categoryname',
      'brand': 'brandname', 'brand_name': 'brandname',
      'short_description': 'shortdesc', 'excerpt': 'shortdesc',
      'active': 'isactive', 'published': 'isactive', 'status': 'isactive',
      'meta_title': 'metatitle', 'seo_title': 'metatitle',
      'meta_description': 'metadesc', 'seo_description': 'metadesc',
    };

    const headers = rawHeaders.map(h => {
      const normalized = h.replace(/_/g, '');
      return headerMap[h] ?? headerMap[normalized] ?? h;
    });

    return lines.slice(1).map((line) => {
      const values = this.parseCsvLine(line);
      const row: any = {};
      headers.forEach((header, i) => { row[header] = values[i]?.trim().replace(/^"|"$/g, '') ?? ''; });
      return row as CsvProductRow;
    });
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes; continue; }
      if (line[i] === ',' && !inQuotes) { result.push(current); current = ''; continue; }
      current += line[i];
    }
    result.push(current);
    return result;
  }

  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  async importProducts(csvContent: string, opts: { dryRun?: boolean; updateExisting?: boolean } = {}): Promise<{
    created: number; updated: number; failed: number; errors: string[];
  }> {
    const rows = this.parseCsv(csvContent);
    const stats = { created: 0, updated: 0, failed: 0, errors: [] as string[] };

    if (opts.dryRun) {
      return { ...stats, created: rows.length, errors: [] };
    }

    // Cache categories and brands for performance
    const categoryCache = new Map<string, string>();
    const brandCache = new Map<string, string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        if (!row.name?.trim()) { stats.failed++; stats.errors.push(`Row ${rowNum}: name is required`); continue; }
        if (!row.sku?.trim()) { stats.failed++; stats.errors.push(`Row ${rowNum}: SKU is required`); continue; }
        const basePrice = parseFloat((row as any).baseprice ?? row.basePrice ?? '0');
        if (isNaN(basePrice) || basePrice < 0) { stats.failed++; stats.errors.push(`Row ${rowNum}: invalid base price`); continue; }

        // Resolve category
        let categoryId: string | undefined;
        const catName = ((row as any).categoryname ?? row.categoryName ?? '').trim();
        if (catName) {
          if (categoryCache.has(catName)) {
            categoryId = categoryCache.get(catName);
          } else {
            let cat = await this.prisma.category.findFirst({ where: { name: { equals: catName, mode: 'insensitive' } } });
            if (!cat) {
              const slug = this.slugify(catName);
              cat = await this.prisma.category.upsert({
                where: { slug },
                update: {},
                create: { name: catName, slug, isActive: true },
              });
            }
            categoryCache.set(catName, cat.id);
            categoryId = cat.id;
          }
        }

        // Resolve brand
        let brandId: string | undefined;
        const brandName = ((row as any).brandname ?? row.brandName ?? '').trim();
        if (brandName) {
          if (brandCache.has(brandName)) {
            brandId = brandCache.get(brandName);
          } else {
            let brand = await (this.prisma as any).brand?.findFirst({ where: { name: { equals: brandName, mode: 'insensitive' } } });
            if (!brand && (this.prisma as any).brand) {
              const slug = this.slugify(brandName);
              brand = await (this.prisma as any).brand.upsert({
                where: { slug },
                update: {},
                create: { name: brandName, slug },
              });
            }
            if (brand) {
              brandCache.set(brandName, brand.id);
              brandId = brand.id;
            }
          }
        }

        const slug = ((row as any).slug?.trim() || this.slugify(row.name));
        const isActiveRaw = (row as any).isactive ?? '';
        const isActive = !isActiveRaw || ['true', '1', 'yes', 'active', 'published'].includes(isActiveRaw.toLowerCase());

        const productData: any = {
          name: row.name.trim(),
          description: row.description?.trim() || null,
          shortDesc: (row as any).shortdesc?.trim() || row.shortDesc?.trim() || null,
          sku: row.sku.trim(),
          basePrice,
          salePrice: (row as any).saleprice && !isNaN(parseFloat((row as any).saleprice)) ? parseFloat((row as any).saleprice) : null,
          stockQuantity: (row as any).stockquantity ? parseInt((row as any).stockquantity, 10) : 0,
          categoryId: categoryId ?? await this.getDefaultCategoryId(),
          brandId: brandId ?? null,
          tags: row.tags ? row.tags.split(/[,|;]/).map(t => t.trim()).filter(Boolean) : [],
          weight: row.weight ? parseFloat(row.weight) : null,
          isActive,
          metaTitle: (row as any).metatitle?.trim() || null,
          metaDesc: (row as any).metadesc?.trim() || null,
        };

        // Upsert by SKU
        const existing = await this.prisma.product.findUnique({ where: { sku: row.sku.trim() } });
        if (existing) {
          if (opts.updateExisting) {
            await this.prisma.product.update({ where: { sku: row.sku.trim() }, data: productData });
            stats.updated++;
          } else {
            stats.failed++;
            stats.errors.push(`Row ${rowNum}: SKU ${row.sku} already exists (use updateExisting=true to overwrite)`);
          }
        } else {
          // Generate unique slug
          let finalSlug = slug;
          const slugExists = await this.prisma.product.findUnique({ where: { slug: finalSlug } });
          if (slugExists) finalSlug = `${slug}-${Date.now()}`;
          await this.prisma.product.create({ data: { ...productData, slug: finalSlug } });
          stats.created++;
        }
      } catch (err: any) {
        stats.failed++;
        stats.errors.push(`Row ${rowNum}: ${err.message}`);
      }
    }

    return stats;
  }

  private async getDefaultCategoryId(): Promise<string> {
    const cat = await this.prisma.category.findFirst({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
    if (cat) return cat.id;
    const newCat = await this.prisma.category.create({ data: { name: 'Uncategorized', slug: 'uncategorized', isActive: true } });
    return newCat.id;
  }
}
