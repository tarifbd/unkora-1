import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RecaptchaService {
  constructor(private readonly config: ConfigService) {}

  async verify(token: string, action?: string, minScore = 0.5): Promise<boolean> {
    const secret = this.config.get<string>('RECAPTCHA_SECRET_KEY');
    if (!secret) {
      // reCAPTCHA not configured — skip verification
      return true;
    }

    try {
      const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token }).toString(),
      });
      const data = await res.json() as any;

      if (!data.success) return false;
      if (action && data.action !== action) return false;
      if (data.score !== undefined && data.score < minScore) return false;
      return true;
    } catch {
      return true; // Don't block on network errors
    }
  }

  async assertValid(token: string | undefined, action?: string): Promise<void> {
    if (!token) return; // No token = skip (for backward compat)
    const valid = await this.verify(token, action);
    if (!valid) throw new BadRequestException('reCAPTCHA verification failed. Please try again.');
  }
}
