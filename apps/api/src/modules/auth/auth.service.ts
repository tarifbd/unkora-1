import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenType } from '@prisma/client';
import type { JwtPayload } from '@unkora/types';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        status: 'PENDING_VERIFICATION',
      },
    });

    // Send verification email (non-blocking)
    this.sendVerificationEmail(user.id, user.email).catch(() => {});

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user: this.usersService.toDto(user), tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    if (user.status === 'SUSPENDED') throw new UnauthorizedException('Account suspended');

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user: this.usersService.toDto(user), tokens };
  }

  async refreshTokens(refreshToken: string) {
    const stored = await this.prisma.token.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.type !== TokenType.REFRESH || stored.usedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    await this.prisma.token.update({
      where: { id: stored.id },
      data: { usedAt: new Date() },
    });

    const tokens = await this.generateTokens(stored.user.id, stored.user.email, stored.user.role);
    await this.saveRefreshToken(stored.user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.token.deleteMany({
      where: { userId, type: TokenType.REFRESH },
    });
    return { message: 'Logged out successfully' };
  }

  // ─── Password Reset ────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email is registered, a reset link has been sent.' };

    // Invalidate existing reset tokens
    await this.prisma.token.deleteMany({
      where: { userId: user.id, type: TokenType.PASSWORD_RESET },
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.token.create({
      data: { userId: user.id, token: tokenHash, type: TokenType.PASSWORD_RESET, expiresAt },
    });

    const siteUrl = this.config.get<string>('SITE_URL') ?? 'http://localhost:3000';
    const resetUrl = `${siteUrl}/auth/reset-password?token=${rawToken}`;

    await this.emailService.sendPasswordReset(email, resetUrl, user.firstName);

    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const stored = await this.prisma.token.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!stored || stored.type !== TokenType.PASSWORD_RESET || stored.usedAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (stored.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash },
      }),
      this.prisma.token.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all refresh tokens (force re-login)
      this.prisma.token.deleteMany({
        where: { userId: stored.userId, type: TokenType.REFRESH },
      }),
    ]);

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  // ─── Email Verification ────────────────────────────────────

  private async sendVerificationEmail(userId: string, email: string) {
    await this.prisma.token.deleteMany({
      where: { userId, type: TokenType.EMAIL_VERIFICATION },
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.token.create({
      data: { userId, token: tokenHash, type: TokenType.EMAIL_VERIFICATION, expiresAt },
    });

    const siteUrl = this.config.get<string>('SITE_URL') ?? 'http://localhost:3000';
    const verifyUrl = `${siteUrl}/auth/verify-email?token=${rawToken}`;

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true } });
    await this.emailService.sendEmailVerification(email, verifyUrl, user?.firstName ?? 'Customer');
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerifiedAt) throw new BadRequestException('Email already verified');

    await this.sendVerificationEmail(user.id, user.email);
    return { message: 'Verification email sent' };
  }

  async verifyEmail(rawToken: string) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const stored = await this.prisma.token.findUnique({
      where: { token: tokenHash },
    });

    if (!stored || stored.type !== TokenType.EMAIL_VERIFICATION || stored.usedAt) {
      throw new BadRequestException('Invalid or already used verification link');
    }

    if (stored.expiresAt < new Date()) {
      throw new BadRequestException('Verification link has expired. Request a new one.');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { emailVerifiedAt: new Date(), status: 'ACTIVE' },
      }),
      this.prisma.token.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  // ─── Private helpers ───────────────────────────────────────

  private async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };
    const expiresIn = this.config.get<string>('jwt.expiresIn') ?? '15m';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn') ?? '7d',
      }),
    ]);

    const expiresInMs = this.parseExpiresIn(expiresIn);
    return { accessToken, refreshToken, expiresIn: expiresInMs };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresIn = this.config.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const expiresAt = new Date(Date.now() + this.parseExpiresIn(expiresIn));
    await this.prisma.token.create({
      data: { userId, token, type: TokenType.REFRESH, expiresAt },
    });
  }

  private parseExpiresIn(value: string): number {
    const unit = value.slice(-1);
    const amount = parseInt(value.slice(0, -1), 10);
    const multipliers: Record<string, number> = {
      s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000,
    };
    return amount * (multipliers[unit] ?? 1000);
  }
}
