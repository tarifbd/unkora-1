import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { CategoriesService } from './categories.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  product: { count: jest.fn() },
};

const mockCache = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(null);
  });

  describe('findById', () => {
    it('returns category when found', async () => {
      const cat = { id: '1', name: 'Books' };
      mockPrisma.category.findUnique.mockResolvedValue(cat);
      await expect(service.findById('1')).resolves.toEqual(cat);
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates category when slug is unique', async () => {
      const dto = { name: 'Science', slug: 'science' };
      mockPrisma.category.findUnique
        .mockResolvedValueOnce(null) // slug check
      mockPrisma.category.create.mockResolvedValue({ id: '2', ...dto });

      await expect(service.create(dto as any)).resolves.toMatchObject({ slug: 'science' });
      expect(mockCache.del).toHaveBeenCalledTimes(2);
    });

    it('throws ConflictException when slug exists', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: '1', slug: 'science' });
      await expect(service.create({ name: 'Science', slug: 'science' } as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('deletes category with no products', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.category.delete.mockResolvedValue({ id: '1' });

      await expect(service.remove('1')).resolves.toMatchObject({ id: '1' });
    });

    it('throws ConflictException when products exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.product.count.mockResolvedValue(5);

      await expect(service.remove('1')).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns cached result when available', async () => {
      const cached = [{ id: '1' }];
      mockCache.get.mockResolvedValue(cached);

      const result = await service.findAll();
      expect(result).toBe(cached);
      expect(mockPrisma.category.findMany).not.toHaveBeenCalled();
    });

    it('queries DB and caches when cache miss', async () => {
      const cats = [{ id: '1', name: 'Books' }];
      mockPrisma.category.findMany.mockResolvedValue(cats);

      const result = await service.findAll();
      expect(result).toBe(cats);
      expect(mockCache.set).toHaveBeenCalledTimes(1);
    });
  });
});
