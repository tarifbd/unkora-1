import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuctionStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { PlaceBidDto } from './dto/place-bid.dto';

@Injectable()
export class AuctionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(params: { status?: AuctionStatus; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = params.status ? { status: params.status } : {};

    return this.prisma.$transaction(async tx => {
      const [data, total] = await Promise.all([
        tx.auction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            product: { select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } },
            _count: { select: { bids: true } },
          },
        }),
        tx.auction.count({ where }),
      ]);
      return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    });
  }

  findActive() {
    const now = new Date();
    return this.prisma.auction.findMany({
      where: { status: AuctionStatus.ACTIVE, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { endsAt: 'asc' },
      include: {
        product: { select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } },
        _count: { select: { bids: true } },
      },
    });
  }

  async findOne(id: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, slug: true, images: { orderBy: { sortOrder: 'asc' } } } },
        winner: { select: { id: true, firstName: true, lastName: true, email: true } },
        bids: {
          orderBy: { amount: 'desc' },
          take: 20,
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        _count: { select: { bids: true } },
      },
    });
    if (!auction) throw new NotFoundException('Auction not found');
    return auction;
  }

  async create(dto: CreateAuctionDto, createdBy?: string) {
    return this.prisma.auction.create({
      data: {
        ...dto,
        startingPrice: dto.startingPrice,
        currentPrice: dto.startingPrice,
        reservePrice: dto.reservePrice ?? null,
        bidIncrement: dto.bidIncrement ?? 10,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        createdBy,
      },
      include: { product: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, dto: UpdateAuctionDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.startsAt) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt) data.endsAt = new Date(dto.endsAt);
    if (dto.startingPrice !== undefined) data.startingPrice = dto.startingPrice;
    if (dto.reservePrice !== undefined) data.reservePrice = dto.reservePrice;
    if (dto.bidIncrement !== undefined) data.bidIncrement = dto.bidIncrement;
    return this.prisma.auction.update({ where: { id }, data });
  }

  async placeBid(auctionId: string, userId: string, dto: PlaceBidDto) {
    const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction) throw new NotFoundException('Auction not found');

    const now = new Date();
    if (auction.status !== AuctionStatus.ACTIVE) throw new BadRequestException('Auction is not active');
    if (now < auction.startsAt) throw new BadRequestException('Auction has not started yet');
    if (now > auction.endsAt) throw new BadRequestException('Auction has ended');

    const minBid = Number(auction.currentPrice) + Number(auction.bidIncrement);
    if (dto.amount < minBid) {
      throw new BadRequestException(`Minimum bid is ${minBid}`);
    }

    return this.prisma.$transaction(async tx => {
      await tx.auctionBid.updateMany({ where: { auctionId, isWinning: true }, data: { isWinning: false } });

      const bid = await tx.auctionBid.create({
        data: { auctionId, userId, amount: dto.amount, isWinning: true },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      });

      await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentPrice: dto.amount,
          totalBids: { increment: 1 },
          winnerId: userId,
        },
      });

      return bid;
    });
  }

  async endAuction(id: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id },
      include: { bids: { orderBy: { amount: 'desc' }, take: 1 } },
    });
    if (!auction) throw new NotFoundException('Auction not found');

    const topBid = auction.bids[0];
    const reserveMet = !auction.reservePrice || (topBid && Number(topBid.amount) >= Number(auction.reservePrice));

    return this.prisma.auction.update({
      where: { id },
      data: {
        status: topBid && reserveMet ? AuctionStatus.SOLD : AuctionStatus.ENDED,
        winnerId: topBid && reserveMet ? topBid.userId : null,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.auction.delete({ where: { id } });
  }

  getBidHistory(auctionId: string) {
    return this.prisma.auctionBid.findMany({
      where: { auctionId },
      orderBy: { amount: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }
}
