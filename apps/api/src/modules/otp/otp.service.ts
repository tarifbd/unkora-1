import { Injectable, BadRequestException } from '@nestjs/common';
import { SmsService } from '../sms/sms.service';

// Simple in-memory OTP store (use Redis in production via CACHE_MANAGER)
// Key: phone number, Value: { code, expiresAt }
const OTP_STORE = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;
const OTP_LENGTH = 6;

@Injectable()
export class OtpService {
  constructor(private readonly smsService: SmsService) {}

  generateCode(length = OTP_LENGTH): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  }

  async sendOtp(phone: string): Promise<{ message: string; expiresInMinutes: number }> {
    // Rate limit: don't resend if one already sent in last 60s
    const existing = OTP_STORE.get(phone);
    if (existing && existing.expiresAt - OTP_TTL_MS + 60000 > Date.now()) {
      throw new BadRequestException('OTP already sent. Please wait 60 seconds before requesting again.');
    }

    const code = this.generateCode();
    OTP_STORE.set(phone, { code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });

    const message = `Your Unkora verification code is: ${code}. Valid for 5 minutes. Do not share with anyone.`;
    await this.smsService.sendSms(phone, message);

    return { message: 'OTP sent successfully', expiresInMinutes: 5 };
  }

  async verifyOtp(phone: string, code: string): Promise<{ valid: boolean; message: string }> {
    const stored = OTP_STORE.get(phone);

    if (!stored) {
      return { valid: false, message: 'No OTP found for this phone number. Please request a new one.' };
    }

    if (Date.now() > stored.expiresAt) {
      OTP_STORE.delete(phone);
      return { valid: false, message: 'OTP has expired. Please request a new one.' };
    }

    stored.attempts += 1;
    if (stored.attempts > MAX_ATTEMPTS) {
      OTP_STORE.delete(phone);
      return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }

    if (stored.code !== code) {
      const remaining = MAX_ATTEMPTS - stored.attempts;
      return { valid: false, message: `Invalid OTP. ${remaining} attempt(s) remaining.` };
    }

    // Valid — remove from store
    OTP_STORE.delete(phone);
    return { valid: true, message: 'OTP verified successfully' };
  }

  // Called by auth service to check if OTP is valid without removing it (peek)
  async peekOtp(phone: string, code: string): Promise<boolean> {
    const stored = OTP_STORE.get(phone);
    if (!stored) return false;
    if (Date.now() > stored.expiresAt) { OTP_STORE.delete(phone); return false; }
    return stored.code === code;
  }
}
