import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';

import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  product: { findUnique: jest.fn() },
  review: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  orderItem: { findFirst: jest.fn() },
};

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = 'u1';
    const productId = 'p1';
    const dto = { rating: 4, title: 'Great', body: 'Loved it' };

    it('creates an unverified review when no purchase history', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: productId, isActive: true });
      mockPrisma.review.findUnique.mockResolvedValue(null);
      mockPrisma.orderItem.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue({ id: 'r1', isVerified: false, ...dto });

      const result = await service.create(userId, productId, dto as any);
      expect(result.isVerified).toBe(false);
    });

    it('creates a verified review when user has delivered order', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: productId, isActive: true });
      mockPrisma.review.findUnique.mockResolvedValue(null);
      mockPrisma.orderItem.findFirst.mockResolvedValue({ id: 'oi1' });
      mockPrisma.review.create.mockResolvedValue({ id: 'r1', isVerified: true, ...dto });

      const result = await service.create(userId, productId, dto as any);
      expect(result.isVerified).toBe(true);
    });

    it('throws NotFoundException for inactive product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: productId, isActive: false });
      await expect(service.create(userId, productId, dto as any)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when review already exists', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: productId, isActive: true });
      mockPrisma.review.findUnique.mockResolvedValue({ id: 'r1' });
      await expect(service.create(userId, productId, dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByProduct', () => {
    it('returns paginated reviews with aggregate stats', async () => {
      const reviews = [{ id: 'r1', rating: 4 }];
      mockPrisma.review.findMany.mockResolvedValue(reviews);
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.3 }, _count: { id: 10 } });

      const result = await service.findByProduct('p1', 1, 20);
      expect(result.reviews).toBe(reviews);
      expect(result.totalCount).toBe(10);
      expect(result.averageRating).toBe(4.3);
      expect(result.totalPages).toBe(1);
    });

    it('rounds average rating to 1 decimal', async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.666 }, _count: { id: 3 } });

      const result = await service.findByProduct('p1');
      expect(result.averageRating).toBe(4.7);
    });
  });

  describe('update', () => {
    it('throws ForbiddenException when user is not the author', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({ id: 'r1', userId: 'other' });
      await expect(service.update('u1', 'r1', {} as any)).rejects.toThrow(ForbiddenException);
    });

    it('updates review for the correct user', async () => {
      const updated = { id: 'r1', rating: 5 };
      mockPrisma.review.findUnique.mockResolvedValue({ id: 'r1', userId: 'u1' });
      mockPrisma.review.update.mockResolvedValue(updated);

      await expect(service.update('u1', 'r1', { rating: 5 } as any)).resolves.toEqual(updated);
    });
  });

  describe('delete', () => {
    it('throws ForbiddenException when user is not the author', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({ id: 'r1', userId: 'other' });
      await expect(service.delete('u1', 'r1')).rejects.toThrow(ForbiddenException);
    });

    it('deletes review for the correct user', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({ id: 'r1', userId: 'u1' });
      mockPrisma.review.delete.mockResolvedValue({});

      await expect(service.delete('u1', 'r1')).resolves.toEqual({ message: 'Review deleted' });
    });
  });
});
