import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogPostStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

import { PrismaService } from '../../database/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    const existing = await this.prisma.blogPost.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return baseSlug;
    }

    // Append a short random suffix to ensure uniqueness
    const suffix = randomBytes(4).toString('hex');
    return `${baseSlug}-${suffix}`;
  }

  async create(authorId: string, dto: CreatePostDto) {
    const baseSlug = this.generateSlug(dto.title);
    const slug = await this.ensureUniqueSlug(baseSlug);

    const status = dto.status ?? BlogPostStatus.DRAFT;
    const publishedAt = status === BlogPostStatus.PUBLISHED ? new Date() : null;

    return this.prisma.blogPost.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content,
        excerpt: dto.excerpt,
        coverImage: dto.coverImage,
        authorId,
        status,
        tags: dto.tags ?? [],
        metaTitle: dto.metaTitle,
        metaDesc: dto.metaDesc,
        ...(publishedAt && { publishedAt }),
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findAll(query: { status?: string; page?: number; limit?: number; tag?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) {
      where.status = query.status as BlogPostStatus;
    }
    if (query.tag) {
      where.tags = { has: query.tag };
    }

    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findPublished(query: { page?: number; limit?: number; tag?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status: BlogPostStatus.PUBLISHED };
    if (query.tag) {
      where.tags = { has: query.tag };
    }

    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!post) throw new NotFoundException('Blog post not found');
    if (post.status !== BlogPostStatus.PUBLISHED) {
      throw new NotFoundException('Blog post not found');
    }

    return post;
  }

  async findOneAdmin(id: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async update(id: string, dto: UpdatePostDto) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Blog post not found');

    const data: Record<string, unknown> = {};

    if (dto.title !== undefined && dto.title !== post.title) {
      const baseSlug = this.generateSlug(dto.title);
      const existingWithSlug = await this.prisma.blogPost.findUnique({
        where: { slug: baseSlug },
        select: { id: true },
      });
      // Only update slug if it doesn't conflict with another post
      if (!existingWithSlug || existingWithSlug.id === id) {
        data.slug = baseSlug;
      } else {
        const suffix = randomBytes(4).toString('hex');
        data.slug = `${baseSlug}-${suffix}`;
      }
      data.title = dto.title;
    }

    if (dto.content !== undefined) data.content = dto.content;
    if (dto.excerpt !== undefined) data.excerpt = dto.excerpt;
    if (dto.coverImage !== undefined) data.coverImage = dto.coverImage;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.metaTitle !== undefined) data.metaTitle = dto.metaTitle;
    if (dto.metaDesc !== undefined) data.metaDesc = dto.metaDesc;

    if (dto.status !== undefined) {
      data.status = dto.status;
      // Set publishedAt when transitioning to PUBLISHED for the first time
      if (dto.status === BlogPostStatus.PUBLISHED && post.status !== BlogPostStatus.PUBLISHED && !post.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    return this.prisma.blogPost.update({
      where: { id },
      data,
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async remove(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Blog post not found');

    await this.prisma.blogPost.delete({ where: { id } });
    return { message: 'Blog post deleted successfully' };
  }
}
