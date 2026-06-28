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
import { OtpService } from '../otp/otp.service';
import { UsersService } from '../users/users.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { RecaptchaService } from './recaptcha.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
    private readonly recaptcha: RecaptchaService,
  ) {}

  async register(dto: RegisterDto) {
    await this.recaptcha.verifyOrThrow(dto.recaptchaToken, 'register');

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
    await this.recaptcha.verifyOrThrow(dto.recaptchaToken, 'login');

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
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await this.prisma.token.findUnique({
      where: { token: tokenHash },
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

  async forgotPassword(email: string, recaptchaToken?: string) {
    await this.recaptcha.verifyOrThrow(recaptchaToken, 'forgot_password');

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

  async loginWithPhone(phone: string, otpCode: string) {
    const result = await this.otpService.verifyOtp(phone, otpCode);
    if (!result.valid) {
      throw new UnauthorizedException(result.message);
    }

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new UnauthorizedException('No account found with this phone number. Please register first.');
    }
    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account suspended');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { data: { user: this.usersService.toDto(user), tokens } };
  }

  async socialLogin(dto: {
    provider: 'google' | 'facebook';
    providerId: string;
    email: string;
    firstName: string;
    lastName?: string;
    avatarUrl?: string;
  }) {
    // Find by email or create new user
    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName ?? '',
          avatarUrl: dto.avatarUrl,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(), // Social logins are pre-verified
        },
      });
    } else if (!user.emailVerifiedAt) {
      // Mark existing unverified account as verified
      await this.prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date(), status: 'ACTIVE' } });
    }

    if (user.status === 'SUSPENDED') throw new UnauthorizedException('Account suspended');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return { user: this.usersService.toDto(user), tokens };
  }

  async verifyGoogleToken(idToken: string): Promise<{ email: string; firstName: string; lastName: string; avatarUrl: string; providerId: string }> {
    // Verify Google ID token via Google's tokeninfo endpoint
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const data = await res.json() as any;
    if (data.error || !data.email) throw new UnauthorizedException('Invalid Google token: ' + (data.error_description ?? 'verification failed'));
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (clientId && data.aud !== clientId) throw new UnauthorizedException('Google token audience mismatch');
    return {
      email: data.email,
      firstName: data.given_name ?? data.name?.split(' ')[0] ?? '',
      lastName: data.family_name ?? data.name?.split(' ').slice(1).join(' ') ?? '',
      avatarUrl: data.picture ?? '',
      providerId: data.sub,
    };
  }

  async verifyFacebookToken(accessToken: string): Promise<{ email: string; firstName: string; lastName: string; avatarUrl: string; providerId: string }> {
    const appId = this.config.get<string>('FACEBOOK_APP_ID');
    const appSecret = this.config.get<string>('FACEBOOK_APP_SECRET');
    if (!appId || !appSecret) throw new BadRequestException('Facebook OAuth not configured');

    // Verify token
    const verifyRes = await fetch(`https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`);
    const verify = await verifyRes.json() as any;
    if (!verify.data?.is_valid) throw new UnauthorizedException('Invalid Facebook token');

    // Get user profile
    const profileRes = await fetch(`https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture&access_token=${accessToken}`);
    const profile = await profileRes.json() as any;
    return {
      email: profile.email ?? '',
      firstName: profile.first_name ?? '',
      lastName: profile.last_name ?? '',
      avatarUrl: profile.picture?.data?.url ?? '',
      providerId: profile.id,
    };
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
    // Store only a SHA-256 hash (same as reset/verification tokens) so a
    // read-only DB leak does not hand out usable refresh tokens.
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.prisma.token.create({
      data: { userId, token: tokenHash, type: TokenType.REFRESH, expiresAt },
    });
  }

  private parseExpiresIn(value: string): number {
    if (!/^\d+[smhd]$/.test(value)) {
      throw new Error(`Invalid expiresIn format: ${value}. Expected format: <number>[s|m|h|d]`);
    }
    const unit = value.slice(-1);
    const amount = parseInt(value.slice(0, -1), 10);
    const multipliers: Record<string, number> = {
      s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000,
    };
    return amount * (multipliers[unit] ?? 1000);
  }
}
