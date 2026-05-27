import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Built-in addons registry
const BUILT_IN_ADDONS = [
  { slug: 'sslcommerz', name: 'SSLCommerz Payment', description: 'Accept payments via SSLCommerz gateway', icon: '💳', category: 'payment', isCore: false },
  { slug: 'bkash', name: 'bKash Payment', description: 'Accept bKash mobile payments', icon: '📱', category: 'payment', isCore: false },
  { slug: 'shiprocket', name: 'Shiprocket Courier', description: 'Automated shipping via Shiprocket', icon: '🚚', category: 'shipping', isCore: false },
  { slug: 'google-analytics', name: 'Google Analytics', description: 'Track visitors with GA4', icon: '📊', category: 'analytics', isCore: false },
  { slug: 'facebook-pixel', name: 'Facebook Pixel', description: 'Track conversions with Meta Pixel', icon: '📘', category: 'analytics', isCore: false },
  { slug: 'recaptcha', name: 'Google reCAPTCHA', description: 'Protect forms with reCAPTCHA v3', icon: '🤖', category: 'security', isCore: false },
  { slug: 'ai-studio', name: 'AI Content Studio', description: 'Generate product content with AI', icon: '🤖', category: 'ai', isCore: false },
  { slug: 'preorder', name: 'Preorder System', description: 'Allow customers to preorder products', icon: '⏳', category: 'sales', isCore: false },
  { slug: 'classifieds', name: 'Classified Ads', description: 'Allow customers to post classified ads', icon: '📋', category: 'marketplace', isCore: false },
  { slug: 'loyalty-points', name: 'Loyalty Points', description: 'Reward customers with points', icon: '⭐', category: 'marketing', isCore: false },
  { slug: 'referrals', name: 'Referral Program', description: 'Customer referral tracking and rewards', icon: '🤝', category: 'marketing', isCore: false },
  { slug: 'affiliates', name: 'Affiliate System', description: 'Affiliate marketing management', icon: '💰', category: 'marketing', isCore: false },
  { slug: 'pos', name: 'Point of Sale', description: 'Offline POS terminal', icon: '🖥️', category: 'sales', isCore: false },
  { slug: 'auctions', name: 'Auctions', description: 'Run timed product auctions', icon: '🔨', category: 'sales', isCore: false },
  { slug: 'gift-cards', name: 'Gift Cards', description: 'Sell and redeem gift cards', icon: '🎁', category: 'sales', isCore: false },
  { slug: 'flash-deals', name: 'Flash Deals', description: 'Time-limited promotional deals', icon: '⚡', category: 'promotions', isCore: false },
  { slug: 'sms', name: 'SMS Notifications', description: 'Send SMS via SSL Wireless/Twilio', icon: '📲', category: 'communications', isCore: false },
  { slug: 'push-notifications', name: 'Push Notifications', description: 'Web push notifications via FCM', icon: '🔔', category: 'communications', isCore: false },
  { slug: 'blog', name: 'Blog', description: 'Content management and blogging', icon: '📝', category: 'content', isCore: false },
  { slug: 'sellers', name: 'Multi-Vendor', description: 'Allow sellers to list products', icon: '🏪', category: 'marketplace', isCore: false },
];

@Injectable()
export class AddonsService {
  constructor(private readonly prisma: PrismaService) {}

  async seedBuiltIns() {
    for (const addon of BUILT_IN_ADDONS) {
      await (this.prisma as any).addon.upsert({
        where: { slug: addon.slug },
        update: { name: addon.name, description: addon.description },
        create: addon,
      });
    }
  }

  async findAll() {
    return (this.prisma as any).addon.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
  }

  async toggle(slug: string, enabled: boolean, config?: Record<string, any>) {
    const addon = await (this.prisma as any).addon.findUnique({ where: { slug } });
    if (!addon) throw new NotFoundException(`Addon '${slug}' not found`);
    return (this.prisma as any).addon.update({
      where: { slug },
      data: { isEnabled: enabled, ...(config ? { config } : {}) },
    });
  }

  async updateConfig(slug: string, config: Record<string, any>) {
    const addon = await (this.prisma as any).addon.findUnique({ where: { slug } });
    if (!addon) throw new NotFoundException(`Addon '${slug}' not found`);
    return (this.prisma as any).addon.update({ where: { slug }, data: { config } });
  }

  async isEnabled(slug: string): Promise<boolean> {
    const addon = await (this.prisma as any).addon.findUnique({ where: { slug }, select: { isEnabled: true } });
    return addon?.isEnabled ?? false;
  }

  async getEnabledSlugs(): Promise<string[]> {
    const enabled = await (this.prisma as any).addon.findMany({ where: { isEnabled: true }, select: { slug: true } });
    return enabled.map((a: any) => a.slug);
  }
}
