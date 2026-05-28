import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import {
  PreorderConfigStatus,
  PreorderOrderStatus,
  PreorderPaymentStatus,
  PreorderEventType,
  PrepaymentType,
  Prisma,
} from '@prisma/client';
import type { CreatePreorderConfigDto } from './dto/create-config.dto';
import type { UpdatePreorderConfigDto } from './dto/update-config.dto';
import type { PlacePreorderDto } from './dto/place-preorder.dto';
import type { UpdatePreorderStatusDto } from './dto/update-status.dto';
import type { AddNoteDto } from './dto/add-note.dto';

type TxClient = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

@Injectable()
export class PreordersService {
  private readonly logger = new Logger(PreordersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private generatePreorderNumber(): string {
    const now = new Date();
    const y = String(now.getFullYear()).slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).toUpperCase().slice(2, 7);
    return `PRE-${y}${m}${d}-${rand}`;
  }

  private calcPrepayment(type: PrepaymentType, amount: number | null, total: number): number {
    if (type === PrepaymentType.NONE) return 0;
    if (type === PrepaymentType.FULL_PAYMENT) return total;
    if (type === PrepaymentType.FIXED_AMOUNT) return Number(amount ?? 0);
    if (type === PrepaymentType.PERCENTAGE) return (total * Number(amount ?? 0)) / 100;
    return 0;
  }

  private async logEvent(
    tx: TxClient,
    preorderOrderId: string,
    eventType: PreorderEventType,
    message: string,
    metadata?: Record<string, unknown>,
    createdBy?: string | null,
  ) {
    await tx.preorderEvent.create({
      data: {
        preorderOrderId,
        eventType,
        message,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        createdBy: createdBy ?? null,
      },
    });
  }

  // ─── Config CRUD ──────────────────────────────────────────────────────────

  async createConfig(dto: CreatePreorderConfigDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.preorderConfig.findUnique({ where: { productId: dto.productId } });
    if (existing) throw new ConflictException('A preorder configuration already exists for this product');

    return this.prisma.preorderConfig.create({
      data: {
        productId: dto.productId,
        variantId: dto.variantId ?? null,
        isEnabled: dto.isEnabled ?? true,
        preorderTitle: dto.preorderTitle ?? null,
        preorderDescription: dto.preorderDescription ?? null,
        expectedReleaseDate: dto.expectedReleaseDate ? new Date(dto.expectedReleaseDate) : null,
        expectedDeliveryStart: dto.expectedDeliveryStart ? new Date(dto.expectedDeliveryStart) : null,
        expectedDeliveryEnd: dto.expectedDeliveryEnd ? new Date(dto.expectedDeliveryEnd) : null,
        preorderStartDate: dto.preorderStartDate ? new Date(dto.preorderStartDate) : null,
        preorderEndDate: dto.preorderEndDate ? new Date(dto.preorderEndDate) : null,
        stockLimit: dto.stockLimit ?? null,
        maxQtyPerCustomer: dto.maxQtyPerCustomer ?? null,
        prepaymentRequired: dto.prepaymentRequired ?? false,
        prepaymentType: dto.prepaymentType ?? PrepaymentType.NONE,
        prepaymentAmount: dto.prepaymentAmount ?? null,
        preorderPrice: dto.preorderPrice ?? null,
        allowCancellation: dto.allowCancellation ?? true,
        cancellationDeadline: dto.cancellationDeadline ? new Date(dto.cancellationDeadline) : null,
        autoConvertToOrder: dto.autoConvertToOrder ?? false,
        status: dto.status ?? PreorderConfigStatus.DRAFT,
      },
      include: {
        product: { select: { name: true, images: { take: 1, select: { url: true } } } },
      },
    });
  }

  async listConfigs(params: { status?: PreorderConfigStatus; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params;
    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      this.prisma.preorderConfig.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, images: { take: 1, select: { url: true } }, sku: true } },
          _count: { select: { preorderOrders: true } },
        },
      }),
      this.prisma.preorderConfig.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getConfig(id: string) {
    const config = await this.prisma.preorderConfig.findUnique({
      where: { id },
      include: {
        product: { select: { name: true, images: { take: 1, select: { url: true } }, sku: true } },
        _count: { select: { preorderOrders: true } },
      },
    });
    if (!config) throw new NotFoundException('Preorder configuration not found');
    return config;
  }

  async getConfigByProduct(productId: string) {
    const config = await this.prisma.preorderConfig.findUnique({
      where: { productId },
      include: { product: { select: { name: true, images: { take: 1, select: { url: true } } } } },
    });
    if (!config) throw new NotFoundException('No preorder configuration for this product');
    return config;
  }

  async updateConfig(id: string, dto: UpdatePreorderConfigDto) {
    await this.getConfig(id);
    return this.prisma.preorderConfig.update({
      where: { id },
      data: {
        ...dto,
        expectedReleaseDate: dto.expectedReleaseDate ? new Date(dto.expectedReleaseDate) : undefined,
        expectedDeliveryStart: dto.expectedDeliveryStart ? new Date(dto.expectedDeliveryStart) : undefined,
        expectedDeliveryEnd: dto.expectedDeliveryEnd ? new Date(dto.expectedDeliveryEnd) : undefined,
        preorderStartDate: dto.preorderStartDate ? new Date(dto.preorderStartDate) : undefined,
        preorderEndDate: dto.preorderEndDate ? new Date(dto.preorderEndDate) : undefined,
        cancellationDeadline: dto.cancellationDeadline ? new Date(dto.cancellationDeadline) : undefined,
      },
      include: {
        product: { select: { name: true, images: { take: 1, select: { url: true } } } },
      },
    });
  }

  async deleteConfig(id: string) {
    const config = await this.getConfig(id);
    if (config.status === PreorderConfigStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete an active configuration. Pause or close it first.');
    }
    const orderCount = await this.prisma.preorderOrder.count({ where: { configId: id } });
    if (orderCount > 0) {
      throw new BadRequestException('Cannot delete a configuration that has existing preorder orders');
    }
    return this.prisma.preorderConfig.delete({ where: { id } });
  }

  async setConfigStatus(id: string, newStatus: PreorderConfigStatus) {
    await this.getConfig(id);
    return this.prisma.preorderConfig.update({ where: { id }, data: { status: newStatus } });
  }

  // ─── Order Placement ──────────────────────────────────────────────────────

  async placePreorder(dto: PlacePreorderDto, customerId?: string) {
    const config = await this.prisma.preorderConfig.findUnique({
      where: { id: dto.configId },
      include: {
        product: {
          select: { basePrice: true, salePrice: true },
        },
      },
    });
    if (!config) throw new NotFoundException('Preorder configuration not found');
    if (!config.isEnabled || config.status !== PreorderConfigStatus.ACTIVE) {
      throw new BadRequestException('This product is not currently available for preorder');
    }

    const now = new Date();
    if (config.preorderStartDate && now < config.preorderStartDate) {
      throw new BadRequestException('Preorder period has not started yet');
    }
    if (config.preorderEndDate && now > config.preorderEndDate) {
      throw new BadRequestException('Preorder period has ended');
    }

    if (config.stockLimit) {
      const placed = await this.prisma.preorderOrder.count({
        where: {
          configId: config.id,
          preorderStatus: { notIn: [PreorderOrderStatus.CANCELLED, PreorderOrderStatus.REFUNDED] },
        },
      });
      if (placed >= config.stockLimit) {
        throw new BadRequestException('Preorder stock limit has been reached');
      }
    }

    if (config.maxQtyPerCustomer && customerId) {
      const agg = await this.prisma.preorderOrder.aggregate({
        _sum: { quantity: true },
        where: {
          configId: config.id,
          customerId,
          preorderStatus: { notIn: [PreorderOrderStatus.CANCELLED, PreorderOrderStatus.REFUNDED] },
        },
      });
      const already = agg._sum.quantity ?? 0;
      if (already + dto.quantity > config.maxQtyPerCustomer) {
        throw new BadRequestException(
          `Maximum ${config.maxQtyPerCustomer} units per customer. You already have ${already}.`,
        );
      }
    }

    const unitPrice =
      config.preorderPrice ??
      config.product.salePrice ??
      config.product.basePrice;

    const totalAmount = Number(unitPrice) * dto.quantity;
    const prepaymentAmount = config.prepaymentRequired
      ? this.calcPrepayment(
          config.prepaymentType,
          config.prepaymentAmount ? Number(config.prepaymentAmount) : null,
          totalAmount,
        )
      : 0;
    const remainingAmount = totalAmount - prepaymentAmount;

    const initialStatus =
      config.prepaymentRequired && prepaymentAmount > 0
        ? PreorderOrderStatus.PENDING_PAYMENT
        : PreorderOrderStatus.CONFIRMED;

    // Re-fetch with product name for email
    const configWithName = await this.prisma.preorderConfig.findUnique({
      where: { id: config.id },
      include: { product: { select: { name: true } } },
    });

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.preorderOrder.create({
        data: {
          preorderNumber: this.generatePreorderNumber(),
          customerId: customerId ?? null,
          productId: config.productId,
          variantId: config.variantId ?? null,
          configId: config.id,
          quantity: dto.quantity,
          unitPrice,
          totalAmount,
          prepaymentAmount,
          remainingAmount,
          paymentStatus: PreorderPaymentStatus.UNPAID,
          preorderStatus: initialStatus,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail ?? null,
          customerPhone: dto.customerPhone,
          shippingAddress: dto.shippingAddress
            ? (dto.shippingAddress as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          note: dto.note ?? null,
          expectedDeliveryDate: config.expectedDeliveryEnd ?? config.expectedDeliveryStart ?? null,
        },
      });

      await this.logEvent(tx, created.id, PreorderEventType.CREATED, 'Preorder placed', {
        quantity: dto.quantity,
        total: totalAmount,
        prepayment: prepaymentAmount,
      });

      if (initialStatus === PreorderOrderStatus.CONFIRMED) {
        await this.logEvent(tx, created.id, PreorderEventType.CONFIRMED, 'Preorder confirmed (no prepayment required)');
      }

      return created;
    });

    if (order.customerEmail && configWithName) {
      this.emailService
        .sendPreorderConfirmation(order.customerEmail, {
          preorderNumber: order.preorderNumber,
          customerName: order.customerName,
          productName: configWithName.product.name,
          quantity: order.quantity,
          totalAmount: Number(order.totalAmount),
          prepaymentAmount: Number(order.prepaymentAmount),
          expectedDelivery:
            order.expectedDeliveryDate?.toISOString().split('T')[0] ?? 'TBD',
        })
        .catch((e) => this.logger.error('Failed to send preorder confirmation email', e));
    }

    return order;
  }

  // ─── Order Queries ────────────────────────────────────────────────────────

  async listOrders(params: {
    configId?: string;
    customerId?: string;
    status?: PreorderOrderStatus;
    page?: number;
    limit?: number;
  }) {
    const { configId, customerId, status, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (configId) where.configId = configId;
    if (customerId) where.customerId = customerId;
    if (status) where.preorderStatus = status;

    const [data, total] = await Promise.all([
      this.prisma.preorderOrder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          config: {
            include: {
              product: { select: { name: true, images: { take: 1, select: { url: true } } } },
            },
          },
        },
      }),
      this.prisma.preorderOrder.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getOrder(id: string) {
    const order = await this.prisma.preorderOrder.findUnique({
      where: { id },
      include: {
        config: {
          include: {
            product: { select: { name: true, images: { take: 1, select: { url: true } }, sku: true } },
          },
        },
        events: { orderBy: { createdAt: 'asc' } },
        notifications: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) throw new NotFoundException('Preorder not found');
    return order;
  }

  async getOrderByNumber(preorderNumber: string) {
    const order = await this.prisma.preorderOrder.findUnique({
      where: { preorderNumber },
      include: {
        config: {
          include: {
            product: { select: { name: true, images: { take: 1, select: { url: true } } } },
          },
        },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Preorder not found');
    return order;
  }

  async getCustomerOrders(customerId: string, page = 1, limit = 10) {
    return this.listOrders({ customerId, page, limit });
  }

  // ─── Status Management ────────────────────────────────────────────────────

  async updateOrderStatus(id: string, dto: UpdatePreorderStatusDto, adminId?: string) {
    const order = await this.getOrder(id);

    const terminal: PreorderOrderStatus[] = [
      PreorderOrderStatus.CONVERTED_TO_ORDER,
      PreorderOrderStatus.CANCELLED,
      PreorderOrderStatus.REFUNDED,
      PreorderOrderStatus.COMPLETED,
    ];
    if (terminal.includes(order.preorderStatus)) {
      throw new BadRequestException(`Cannot change status of a ${order.preorderStatus} preorder`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.preorderOrder.update({
        where: { id },
        data: { preorderStatus: dto.status },
      });
      await this.logEvent(
        tx, id, PreorderEventType.STATUS_CHANGED,
        dto.note ?? `Status changed to ${dto.status}`,
        { from: order.preorderStatus, to: dto.status },
        adminId,
      );
      return updated;
    });
  }

  async addNote(id: string, dto: AddNoteDto, adminId?: string) {
    await this.getOrder(id);
    return this.prisma.preorderEvent.create({
      data: {
        preorderOrderId: id,
        eventType: PreorderEventType.ADMIN_NOTE_ADDED,
        message: dto.note,
        metadata: Prisma.JsonNull,
        createdBy: adminId ?? null,
      },
    });
  }

  async recordPayment(id: string, amount: number, adminId?: string) {
    const order = await this.getOrder(id);

    if (order.paymentStatus === PreorderPaymentStatus.PAID) {
      throw new BadRequestException('Preorder is already fully paid');
    }

    const alreadyPaid = Number(order.prepaymentAmount) - Number(order.remainingAmount);
    const newTotal = alreadyPaid + amount;
    const newRemaining = Math.max(0, Number(order.totalAmount) - newTotal);
    const newPayStatus =
      newRemaining <= 0 ? PreorderPaymentStatus.PAID : PreorderPaymentStatus.PARTIALLY_PAID;

    const newOrderStatus =
      newPayStatus === PreorderPaymentStatus.PAID &&
      order.preorderStatus === PreorderOrderStatus.PENDING_PAYMENT
        ? PreorderOrderStatus.CONFIRMED
        : order.preorderStatus;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.preorderOrder.update({
        where: { id },
        data: { remainingAmount: newRemaining, paymentStatus: newPayStatus, preorderStatus: newOrderStatus },
      });
      await this.logEvent(
        tx, id, PreorderEventType.PAYMENT_RECEIVED,
        `Payment of ${amount} recorded`,
        { amount, newPayStatus, newRemaining },
        adminId,
      );
      if (newOrderStatus === PreorderOrderStatus.CONFIRMED && order.preorderStatus !== PreorderOrderStatus.CONFIRMED) {
        await this.logEvent(tx, id, PreorderEventType.CONFIRMED, 'Preorder confirmed after full prepayment', {}, adminId);
      }
      return updated;
    });
  }

  // ─── Cancellation ─────────────────────────────────────────────────────────

  async cancelOrder(id: string, reason: string, requestedBy?: string) {
    const order = await this.getOrder(id);

    if (order.preorderStatus === PreorderOrderStatus.CANCELLED) {
      throw new BadRequestException('Preorder is already cancelled');
    }
    if (
      order.preorderStatus === PreorderOrderStatus.CONVERTED_TO_ORDER ||
      order.preorderStatus === PreorderOrderStatus.COMPLETED
    ) {
      throw new BadRequestException('Cannot cancel a converted or completed preorder');
    }

    if (!requestedBy) {
      if (!order.config.allowCancellation) {
        throw new BadRequestException('Cancellation is not allowed for this preorder');
      }
      if (order.config.cancellationDeadline && new Date() > order.config.cancellationDeadline) {
        throw new BadRequestException('Cancellation deadline has passed');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.preorderOrder.update({
        where: { id },
        data: { preorderStatus: PreorderOrderStatus.CANCELLED, cancelledAt: new Date() },
      });
      await this.logEvent(
        tx, id, PreorderEventType.CANCELLED,
        reason || 'Order cancelled',
        { reason },
        requestedBy ?? null,
      );
      return updated;
    });
  }

  // ─── Convert to Order ─────────────────────────────────────────────────────

  async convertToOrder(preorderOrderId: string, adminId?: string) {
    const preorder = await this.getOrder(preorderOrderId);

    if (preorder.orderId) {
      return { alreadyConverted: true, orderId: preorder.orderId };
    }

    const allowedStatuses: PreorderOrderStatus[] = [
      PreorderOrderStatus.READY_TO_FULFILL,
      PreorderOrderStatus.WAITING_FOR_STOCK,
      PreorderOrderStatus.CONFIRMED,
    ];
    if (!allowedStatuses.includes(preorder.preorderStatus)) {
      throw new BadRequestException(
        `Cannot convert a preorder in ${preorder.preorderStatus} status`,
      );
    }

    if (!preorder.customerId) {
      throw new BadRequestException('Cannot convert guest preorders — customer must be registered');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: preorder.customerId },
      include: { address: { where: { isDefault: true }, take: 1 } },
    });
    if (!user) throw new NotFoundException('Customer not found');

    const address = user.address[0] ?? null;

    const now = new Date();
    const y = String(now.getFullYear()).slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).toUpperCase().slice(2, 7);
    const orderNumber = `UNK-${y}${m}${d}-${rand}`;

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUniqueOrThrow({
        where: { id: preorder.productId },
        include: { images: { take: 1, select: { url: true } } },
      });
      const total = Number(preorder.totalAmount);

      const shippingAddr: Record<string, string> = address
        ? {
            recipientName: address.recipientName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 ?? '',
            city: address.city,
            district: address.district,
            division: address.division,
            postalCode: address.postalCode ?? '',
          }
        : ((preorder.shippingAddress as Record<string, string>) ?? {});

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: preorder.customerId!,
          addressId: address?.id ?? null,
          paymentMethod: 'COD',
          subtotal: total,
          shippingCost: 0,
          discount: 0,
          total,
          notes: `Converted from preorder ${preorder.preorderNumber}`,
          shippingAddress: shippingAddr as Prisma.InputJsonValue,
          items: {
            create: [
              {
                productId: preorder.productId,
                variantId: preorder.variantId ?? null,
                quantity: preorder.quantity,
                unitPrice: preorder.unitPrice,
                totalPrice: total,
                productName: product.name,
                productSku: product.sku,
                productImage: product.images[0]?.url ?? null,
              },
            ],
          },
          timeline: { create: { status: 'PENDING' } },
        },
      });

      await tx.product.update({
        where: { id: preorder.productId },
        data: { stockQuantity: { decrement: preorder.quantity } },
      });

      await tx.preorderOrder.update({
        where: { id: preorderOrderId },
        data: {
          orderId: order.id,
          preorderStatus: PreorderOrderStatus.CONVERTED_TO_ORDER,
          convertedAt: new Date(),
        },
      });

      await this.logEvent(
        tx, preorderOrderId, PreorderEventType.CONVERTED_TO_ORDER,
        `Converted to order ${orderNumber}`,
        { orderId: order.id, orderNumber },
        adminId,
      );

      return { alreadyConverted: false, orderId: order.id, orderNumber };
    });
  }

  async bulkConvert(configId: string, adminId?: string) {
    const readyOrders = await this.prisma.preorderOrder.findMany({
      where: {
        configId,
        preorderStatus: PreorderOrderStatus.READY_TO_FULFILL,
        orderId: null,
      },
      select: { id: true },
    });

    const results = [];
    for (const o of readyOrders) {
      try {
        const r = await this.convertToOrder(o.id, adminId);
        results.push({ id: o.id, success: true, ...r });
      } catch (e) {
        results.push({ id: o.id, success: false, error: (e as Error).message });
      }
    }
    return results;
  }

  async markStockAvailable(configId: string, adminId?: string) {
    const orders = await this.prisma.preorderOrder.findMany({
      where: { configId, preorderStatus: PreorderOrderStatus.WAITING_FOR_STOCK },
      select: { id: true, customerEmail: true, customerName: true },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const o of orders) {
        await tx.preorderOrder.update({
          where: { id: o.id },
          data: { preorderStatus: PreorderOrderStatus.READY_TO_FULFILL },
        });
        await this.logEvent(tx, o.id, PreorderEventType.STOCK_AVAILABLE, 'Stock available — ready to fulfill', {}, adminId);
      }
      await tx.preorderConfig.update({
        where: { id: configId },
        data: { status: PreorderConfigStatus.CLOSED },
      });
    });

    for (const o of orders) {
      if (o.customerEmail) {
        this.emailService
          .sendPreorderStockAvailable(o.customerEmail, o.customerName)
          .catch((e) => this.logger.error('Stock notification email failed', e));
      }
    }

    return { notified: orders.length };
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────

  async getDashboardStats() {
    const [totalConfigs, activeConfigs, totalOrders, pendingPayment, confirmed, readyToFulfill, converted, cancelled] =
      await Promise.all([
        this.prisma.preorderConfig.count(),
        this.prisma.preorderConfig.count({ where: { status: PreorderConfigStatus.ACTIVE } }),
        this.prisma.preorderOrder.count(),
        this.prisma.preorderOrder.count({ where: { preorderStatus: PreorderOrderStatus.PENDING_PAYMENT } }),
        this.prisma.preorderOrder.count({ where: { preorderStatus: PreorderOrderStatus.CONFIRMED } }),
        this.prisma.preorderOrder.count({ where: { preorderStatus: PreorderOrderStatus.READY_TO_FULFILL } }),
        this.prisma.preorderOrder.count({ where: { preorderStatus: PreorderOrderStatus.CONVERTED_TO_ORDER } }),
        this.prisma.preorderOrder.count({ where: { preorderStatus: PreorderOrderStatus.CANCELLED } }),
      ]);

    const [revenue, prepaid] = await Promise.all([
      this.prisma.preorderOrder.aggregate({
        _sum: { totalAmount: true },
        where: { preorderStatus: { notIn: [PreorderOrderStatus.CANCELLED, PreorderOrderStatus.REFUNDED] } },
      }),
      this.prisma.preorderOrder.aggregate({
        _sum: { prepaymentAmount: true },
        where: { paymentStatus: { in: [PreorderPaymentStatus.PAID, PreorderPaymentStatus.PARTIALLY_PAID] } },
      }),
    ]);

    return {
      totalConfigs,
      activeConfigs,
      totalOrders,
      pendingPayment,
      confirmed,
      readyToFulfill,
      converted,
      cancelled,
      totalRevenue: Number(revenue._sum.totalAmount ?? 0),
      prepaidRevenue: Number(prepaid._sum.prepaymentAmount ?? 0),
    };
  }

  async getRecentOrders(limit = 5) {
    return this.prisma.preorderOrder.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        config: {
          include: {
            product: { select: { name: true, images: { take: 1, select: { url: true } } } },
          },
        },
      },
    });
  }
}
