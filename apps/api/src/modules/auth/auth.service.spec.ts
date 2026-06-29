import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { TokenType } from '@prisma/client';
import * as argon2 from 'argon2';

import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { OtpService } from '../otp/otp.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RecaptchaService } from './recaptcha.service';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('$argon2id$hashed'),
  verify: jest.fn().mockResolvedValue(true),
}));

const USER = {
  id: 'u1',
  email: 'test@example.com',
  passwordHash: '$argon2id$hashed',
  firstName: 'Test',
  lastName: 'User',
  role: 'CUSTOMER',
  status: 'ACTIVE',
  emailVerifiedAt: new Date(),
  lastLoginAt: null,
};

const mockPrisma = {
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  token: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
  $transaction: jest.fn(),
};

const mockUsers  = { toDto: jest.fn((u: any) => ({ id: u.id, email: u.email })) };
const mockJwt    = { signAsync: jest.fn().mockResolvedValue('tok_access') };
const mockConfig = {
  get: jest.fn((key: string) => ({
    'jwt.expiresIn': '15m',
    'jwt.refreshSecret': 'ref-secret',
    'jwt.refreshExpiresIn': '7d',
    'SITE_URL': 'http://localhost:3000',
  }[key])),
};
const mockEmail    = { sendPasswordReset: jest.fn(), sendEmailVerification: jest.fn() };
const mockOtp      = { verifyOtp: jest.fn().mockResolvedValue({ valid: true }) };
const mockRecaptcha = { verifyOrThrow: jest.fn().mockResolvedValue(undefined) };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService,    useValue: mockPrisma },
        { provide: UsersService,     useValue: mockUsers },
        { provide: JwtService,       useValue: mockJwt },
        { provide: ConfigService,    useValue: mockConfig },
        { provide: EmailService,     useValue: mockEmail },
        { provide: OtpService,       useValue: mockOtp },
        { provide: RecaptchaService, useValue: mockRecaptcha },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();

    // Safe defaults for all tests
    mockRecaptcha.verifyOrThrow.mockResolvedValue(undefined);
    mockJwt.signAsync.mockResolvedValue('tok_access');
    mockPrisma.token.create.mockResolvedValue({ id: 't_new' });
    mockPrisma.token.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.user.update.mockResolvedValue(USER);
    mockPrisma.token.update.mockResolvedValue({});
    mockEmail.sendPasswordReset.mockResolvedValue(undefined);
    mockEmail.sendEmailVerification.mockResolvedValue(undefined);
    mockUsers.toDto.mockImplementation((u: any) => ({ id: u.id, email: u.email }));
    mockPrisma.$transaction.mockImplementation((arr: any[]) => Promise.all(arr));
  });

  // ─── register ───────────────────────────────────────────────

  describe('register', () => {
    it('creates user and returns tokens when email is new', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)   // duplicate-email check
        .mockResolvedValue({ firstName: USER.firstName }); // sendVerificationEmail inner lookup
      mockPrisma.user.create.mockResolvedValue(USER);

      const result = await service.register({
        email: USER.email, password: 'Pass123!', firstName: 'Test', lastName: 'User',
      } as any);

      expect(result.user).toMatchObject({ id: USER.id });
      expect(result.tokens.accessToken).toBe('tok_access');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(USER);
      await expect(
        service.register({ email: USER.email, password: 'x' } as any),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  // ─── login ──────────────────────────────────────────────────

  describe('login', () => {
    it('returns user and tokens for valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(USER);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: USER.email, password: 'Pass123!' } as any);

      expect(result.tokens.accessToken).toBe('tok_access');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: USER.id }, data: expect.objectContaining({ lastLoginAt: expect.any(Date) }) }),
      );
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'ghost@x.com', password: 'x' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(USER);
      (argon2.verify as jest.Mock).mockResolvedValue(false);
      await expect(
        service.login({ email: USER.email, password: 'wrong' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for suspended account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...USER, status: 'SUSPENDED' });
      await expect(
        service.login({ email: USER.email, password: 'x' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── refreshTokens ──────────────────────────────────────────

  describe('refreshTokens', () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    it('returns new tokens and marks old token used', async () => {
      mockPrisma.token.findUnique.mockResolvedValue({
        id: 't1', type: TokenType.REFRESH, usedAt: null, expiresAt: future, user: USER,
      });

      const result = await service.refreshTokens('raw_refresh_token');

      expect(result.accessToken).toBe('tok_access');
      expect(mockPrisma.token.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 't1' }, data: { usedAt: expect.any(Date) } }),
      );
    });

    it('throws UnauthorizedException when token not found', async () => {
      mockPrisma.token.findUnique.mockResolvedValue(null);
      await expect(service.refreshTokens('bad')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for already-used token', async () => {
      mockPrisma.token.findUnique.mockResolvedValue({
        id: 't1', type: TokenType.REFRESH, usedAt: new Date(), expiresAt: future, user: USER,
      });
      await expect(service.refreshTokens('used')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for expired token', async () => {
      mockPrisma.token.findUnique.mockResolvedValue({
        id: 't1', type: TokenType.REFRESH, usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: USER,
      });
      await expect(service.refreshTokens('expired')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── logout ─────────────────────────────────────────────────

  describe('logout', () => {
    it('deletes all refresh tokens for the user', async () => {
      const result = await service.logout(USER.id);
      expect(result).toMatchObject({ message: expect.stringContaining('Logged out') });
      expect(mockPrisma.token.deleteMany).toHaveBeenCalledWith({
        where: { userId: USER.id, type: TokenType.REFRESH },
      });
    });
  });

  // ─── forgotPassword ─────────────────────────────────────────

  describe('forgotPassword', () => {
    it('returns generic success even when email is not found (anti-enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.forgotPassword('ghost@x.com');
      expect(result.message).toMatch(/If that email is registered/);
      expect(mockEmail.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('sends reset email and stores hashed token when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(USER);

      const result = await service.forgotPassword(USER.email);

      expect(result.message).toMatch(/If that email is registered/);
      expect(mockEmail.sendPasswordReset).toHaveBeenCalledWith(
        USER.email,
        expect.stringContaining('/auth/reset-password?token='),
        USER.firstName,
      );
      expect(mockPrisma.token.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: TokenType.PASSWORD_RESET }) }),
      );
    });
  });

  // ─── resetPassword ──────────────────────────────────────────

  describe('resetPassword', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000);

    it('updates password hash and invalidates refresh tokens', async () => {
      mockPrisma.token.findUnique.mockResolvedValue({
        id: 't2', type: TokenType.PASSWORD_RESET, usedAt: null, expiresAt: future,
        userId: USER.id, user: USER,
      });
      (argon2.hash as jest.Mock).mockResolvedValue('$argon2id$newhash');
      mockPrisma.user.update.mockResolvedValue({ ...USER, passwordHash: '$argon2id$newhash' });

      const result = await service.resetPassword('raw_reset_token', 'NewPass123!');

      expect(result.message).toMatch(/Password reset successfully/);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('throws BadRequestException for unknown or used token', async () => {
      mockPrisma.token.findUnique.mockResolvedValue(null);
      await expect(service.resetPassword('bad', 'x')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for expired token', async () => {
      mockPrisma.token.findUnique.mockResolvedValue({
        id: 't2', type: TokenType.PASSWORD_RESET, usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        userId: USER.id, user: USER,
      });
      await expect(service.resetPassword('expired', 'x')).rejects.toThrow(BadRequestException);
    });
  });
});
