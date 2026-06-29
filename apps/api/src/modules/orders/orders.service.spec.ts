import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { CouponsService } from '../coupons/coupons.service';
import { FacebookCAPIService } from '../settings/facebook-capi.service';
import { OrdersService } from './orders.service';

// Transaction callback mock — passes mockTx to the callback; array form uses Promise.all.
const mockTx = {
  order:         { create: jest.fn(), update: jest.fn() },
  product:       { updateMany: jest.fn(), update: jest.fn() },
  stockMovement: { createMany: jest.fn() },
  cartItem:      { deleteMany: jest.fn() },
  orderTimeline: { create: jest.fn() },
};

const mockPrisma = {
  cart:    { findUnique: jest.fn() },
  address: { findUnique: jest.fn() },
  order:   { findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn() },
  user:    { findUnique: jest.fn() },
  $transaction: jest.fn((arg: any) =>
    typeof arg === 'function' ? arg(mockTx) : Promise.all(arg),
  ),
};

const mockEmail   = { sendOrderConfirmation: jest.fn(), sendOrderStatusUpdate: jest.fn() };
const mockFbCapi  = { sendPurchase: jest.fn().mockResolvedValue(undefined) };
const mockCoupons = { validate: jest.fn(), apply: jest.fn().mockResolvedValue(undefined) };

// ─── Fixtures ────────────────────────────────────────────────

const PRODUCT = {
  id: 'p1', name: 'Book A', sku: 'BOOK-001', stockQuantity: 10,
  images: [{ url: 'img.jpg', isPrimary: true }],
};

const CART = {
  id: 'cart1',
  userId: 'u1',
  items: [{ productId: 'p1', variantId: null, quantity: 2, price: 300, product: PRODUCT }],
};

const CART_HIGH_VALUE = {
  id: 'cart2',
  userId: 'u1',
  items: [{ productId: 'p1', variantId: null, quantity: 4, price: 300, product: PRODUCT }],
};

const ADDRESS = {
  id: 'addr1', userId: 'u1',
  recipientName: 'Test User', phone: '01911369686',
  addressLine1: '160 Hasan Nagar', addressLine2: null,
  city: 'Dhaka', district: 'Dhaka', division: 'Dhaka', postalCode: '1211',
};

const ORDER_ROW = {
  id: 'order1', orderNumber: 'UNK-260629-XXXXX',
  userId: 'u1', status: OrderStatus.PENDING,
  items: [{ productId: 'p1', quantity: 2 }],
  payment: null,
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService,      useValue: mockPrisma },
        { provide: EmailService,       useValue: mockEmail },
        { provide: FacebookCAPIService, useValue: mockFbCapi },
        { provide: CouponsService,     useValue: mockCoupons },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();

    // Safe defaults
    mockEmail.sendOrderConfirmation.mockResolvedValue(undefined);
    mockEmail.sendOrderStatusUpdate.mockResolvedValue(undefined);
    mockCoupons.apply.mockResolvedValue(undefined);
    mockPrisma.user.findUnique.mockResolvedValue({ email: 'u@test.com' });

    // tx defaults
    mockTx.order.create.mockResolvedValue(ORDER_ROW);
    mockTx.product.updateMany.mockResolvedValue({ count: 1 });
    mockTx.stockMovement.createMany.mockResolvedValue({ count: 1 });
    mockTx.cartItem.deleteMany.mockResolvedValue({ count: 1 });
    mockTx.order.update.mockResolvedValue(ORDER_ROW);
    mockTx.orderTimeline.create.mockResolvedValue({});
    mockTx.product.update.mockResolvedValue({});

    mockPrisma.$transaction.mockImplementation((arg: any) =>
      typeof arg === 'function' ? arg(mockTx) : Promise.all(arg),
    );
  });

  // ─── createFromCart ──────────────────────────────────────────

  describe('createFromCart', () => {
    const DTO = { addressId: 'addr1', paymentMethod: 'COD' } as any;

    it('creates order with correct totals (subtotal < 1000 → ৳60 shipping)', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(CART);      // subtotal = 2×300 = 600
      mockPrisma.address.findUnique.mockResolvedValue(ADDRESS);

      const result = await service.createFromCart('u1', DTO);

      expect(result.id).toBe('order1');
      expect(mockTx.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ subtotal: 600, shippingCost: 60, total: 660 }),
        }),
      );
      expect(mockTx.product.updateMany).toHaveBeenCalledTimes(1);
      expect(mockTx.stockMovement.createMany).toHaveBeenCalledTimes(1);
      expect(mockTx.cartItem.deleteMany).toHaveBeenCalledTimes(1);
    });

    it('applies free shipping when subtotal >= ৳1000', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(CART_HIGH_VALUE); // 4×300 = 1200
      mockPrisma.address.findUnique.mockResolvedValue(ADDRESS);

      await service.createFromCart('u1', DTO);

      expect(mockTx.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ shippingCost: 0 }),
        }),
      );
    });

    it('throws BadRequestException for empty cart', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue({ id: 'cart1', userId: 'u1', items: [] });
      await expect(service.createFromCart('u1', DTO)).rejects.toThrow(BadRequestException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when address not found', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(CART);
      mockPrisma.address.findUnique.mockResolvedValue(null);
      await expect(service.createFromCart('u1', DTO)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when address belongs to different user', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(CART);
      mockPrisma.address.findUnique.mockResolvedValue({ ...ADDRESS, userId: 'other_user' });
      await expect(service.createFromCart('u1', DTO)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when pre-validation detects insufficient stock', async () => {
      const lowStockProduct = { ...PRODUCT, stockQuantity: 1 };
      const cartWithLowStock = { ...CART, items: [{ ...CART.items[0], quantity: 5, product: lowStockProduct }] };
      mockPrisma.cart.findUnique.mockResolvedValue(cartWithLowStock);
      mockPrisma.address.findUnique.mockResolvedValue(ADDRESS);

      await expect(service.createFromCart('u1', DTO)).rejects.toThrow(BadRequestException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when atomic stock deduction fails (concurrent oversell)', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(CART);
      mockPrisma.address.findUnique.mockResolvedValue(ADDRESS);
      // Pre-check passes, but DB atomic update sees count=0 (race condition)
      mockTx.product.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.createFromCart('u1', DTO)).rejects.toThrow(BadRequestException);
    });

    it('applies coupon discount and calls coupons.apply after order creation', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(CART);
      mockPrisma.address.findUnique.mockResolvedValue(ADDRESS);
      mockCoupons.validate.mockResolvedValue({ discountAmount: 50 });

      await service.createFromCart('u1', { ...DTO, couponCode: 'SAVE50' });

      expect(mockCoupons.validate).toHaveBeenCalledWith('SAVE50', 600);
      expect(mockTx.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ discount: 50, total: 610 }), // 600+60-50
        }),
      );
      expect(mockCoupons.apply).toHaveBeenCalledWith('SAVE50');
    });
  });

  // ─── cancel ─────────────────────────────────────────────────

  describe('cancel', () => {
    it('cancels a PENDING order and restores stock', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(ORDER_ROW);

      const result = await service.cancel('order1', 'u1', 'Changed my mind');

      expect(result.id).toBe('order1');
      expect(mockTx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: OrderStatus.CANCELLED }) }),
      );
      expect(mockTx.orderTimeline.create).toHaveBeenCalledTimes(1);
      expect(mockTx.product.update).toHaveBeenCalledTimes(ORDER_ROW.items.length);
    });

    it('throws BadRequestException for non-cancellable status', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ ...ORDER_ROW, status: OrderStatus.SHIPPED });
      await expect(service.cancel('order1', 'u1')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when order not found', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);
      await expect(service.cancel('bad_id', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findByUser ──────────────────────────────────────────────

  describe('findByUser', () => {
    it('returns paginated orders for the user', async () => {
      const rows = [ORDER_ROW];
      mockPrisma.order.findMany.mockResolvedValue(rows);
      mockPrisma.order.count.mockResolvedValue(1);

      const result = await service.findByUser('u1', 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toMatchObject({ total: 1, page: 1, limit: 10, totalPages: 1 });
    });
  });
});
