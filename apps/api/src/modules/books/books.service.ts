import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import type { BookFilterDto } from './dto/book-filter.dto';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: BookFilterDto) {
    const {
      page = 1, limit = 20, author, publisher, language,
      genre, search, series, binding, minPrice, maxPrice,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = filter;

    const bookDetailFilter: Record<string, unknown> = {};
    if (author) bookDetailFilter['author'] = { contains: author, mode: 'insensitive' };
    if (publisher) bookDetailFilter['publisher'] = { contains: publisher, mode: 'insensitive' };
    if (language) bookDetailFilter['language'] = language;
    if (genre) bookDetailFilter['genres'] = { has: genre };
    if (series) bookDetailFilter['series'] = { contains: series, mode: 'insensitive' };
    if (binding) bookDetailFilter['binding'] = binding;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      bookDetail: Object.keys(bookDetailFilter).length > 0
        ? (bookDetailFilter as Prisma.BookDetailWhereInput)
        : { isNot: null },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { bookDetail: { author: { contains: search, mode: 'insensitive' } } },
        { bookDetail: { publisher: { contains: search, mode: 'insensitive' } } },
        { bookDetail: { isbn: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      } as Prisma.DecimalFilter;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sortBy === 'bookDetail.author'
        ? { bookDetail: { author: sortOrder } }
        : { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
          bookDetail: true,
          _count: { select: { reviews: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async getFilterOptions() {
    const [authors, publishers, languages, genres, bindings] = await Promise.all([
      this.prisma.bookDetail.findMany({ select: { author: true }, distinct: ['author'], orderBy: { author: 'asc' } }),
      this.prisma.bookDetail.findMany({ where: { publisher: { not: null } }, select: { publisher: true }, distinct: ['publisher'] }),
      this.prisma.bookDetail.findMany({ select: { language: true }, distinct: ['language'] }),
      this.prisma.bookDetail.findMany({ select: { genres: true } }),
      this.prisma.bookDetail.findMany({ where: { binding: { not: null } }, select: { binding: true }, distinct: ['binding'] }),
    ]);

    const uniqueGenres = [...new Set(genres.flatMap((b) => b.genres))].sort();

    return {
      authors: authors.map((b) => b.author),
      publishers: publishers.map((b) => b.publisher).filter(Boolean),
      languages: languages.map((b) => b.language),
      genres: uniqueGenres,
      bindings: bindings.map((b) => b.binding).filter(Boolean),
    };
  }
}
