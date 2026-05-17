import { Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { UserDto } from '@unkora/types';

import { PrismaService } from '../../database/prisma.service';
import type { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdOrThrow(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, address: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] } },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  // ── Addresses ──────────────────────────────────────────────

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async addAddress(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    const count = await this.prisma.address.count({ where: { userId } });
    return this.prisma.address.create({
      data: { ...dto, userId, isDefault: dto.isDefault ?? count === 0 },
    });
  }

  async updateAddress(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');

    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    return this.prisma.address.update({ where: { id }, data: dto });
  }

  async removeAddress(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');
    return this.prisma.address.delete({ where: { id } });
  }

  async updateProfile(userId: string, dto: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string; dateOfBirth?: string }) {
    const data: Record<string, unknown> = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    if (dto.dateOfBirth) {
      await this.prisma.customerProfile.upsert({
        where: { userId },
        create: { userId, dateOfBirth: new Date(dto.dateOfBirth) },
        update: { dateOfBirth: new Date(dto.dateOfBirth) },
      });
    }

    return this.toDto(user);
  }

  toDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
