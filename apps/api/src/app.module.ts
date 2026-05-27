import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { DatabaseModule } from './database/database.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { BlogModule } from './modules/blog/blog.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ColorsModule } from './modules/colors/colors.module';
import { AttributesModule } from './modules/attributes/attributes.module';
import { SizeGuidesModule } from './modules/size-guides/size-guides.module';
import { WarrantiesModule } from './modules/warranties/warranties.module';
import { ProductLabelsModule } from './modules/product-labels/product-labels.module';
import { ProductNotesModule } from './modules/product-notes/product-notes.module';
import { SmartBarModule } from './modules/smart-bar/smart-bar.module';
import { AuctionsModule } from './modules/auctions/auctions.module';
import { GiftCardsModule } from './modules/gift-cards/gift-cards.module';
import { PosModule } from './modules/pos/pos.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { CourierModule } from './modules/courier/courier.module';
import { SmsModule } from './modules/sms/sms.module';
import { CodReconciliationModule } from './modules/cod-reconciliation/cod-reconciliation.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EmailCampaignsModule } from './modules/email-campaigns/email-campaigns.module';
import { SeoModule } from './modules/seo/seo.module';
import { LocalizationModule } from './modules/localization/localization.module';
import { AffiliatesModule } from './modules/affiliates/affiliates.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { AdvancedReportsModule } from './modules/advanced-reports/advanced-reports.module';
import { StaffModule } from './modules/staff/staff.module';
import { DesignModule } from './modules/design/design.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { AiStudioModule } from './modules/ai-studio/ai-studio.module';
import { BookSubmissionsModule } from './modules/book-submissions/book-submissions.module';
import { BooksModule } from './modules/books/books.module';
import { AppCacheModule } from './modules/cache/cache.module';
import { CartModule } from './modules/cart/cart.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { DeliveryBoysModule } from './modules/delivery-boys/delivery-boys.module';
import { EmailModule } from './modules/email/email.module';
import { HealthModule } from './modules/health/health.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProductsModule } from './modules/products/products.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SearchModule } from './modules/search/search.module';
import { FlashDealsModule } from './modules/flash-deals/flash-deals.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { SupportModule } from './modules/support/support.module';
import { OtpModule } from './modules/otp/otp.module';
import { ShiprocketModule } from './modules/shiprocket/shiprocket.module';
import { PickupPointsModule } from './modules/pickup-points/pickup-points.module';
import { ShippingZonesModule } from './modules/shipping-zones/shipping-zones.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),
    DatabaseModule,
    EmailModule,
    AppCacheModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    BooksModule,
    BookSubmissionsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    AdminModule,
    SearchModule,
    HealthModule,
    ReviewsModule,
    WishlistModule,
    CouponsModule,
    UploadModule,
    InventoryModule,
    ShipmentsModule,
    SettingsModule,
    RefundsModule,
    FlashDealsModule,
    DeliveryBoysModule,
    BlogModule,
    BrandsModule,
    ColorsModule,
    AttributesModule,
    SizeGuidesModule,
    WarrantiesModule,
    ProductLabelsModule,
    ProductNotesModule,
    SmartBarModule,
    AuctionsModule,
    GiftCardsModule,
    LoyaltyModule,
    ReferralsModule,
    PosModule,
    SellersModule,
    CourierModule,
    SmsModule,
    CodReconciliationModule,
    ReturnsModule,
    NotificationsModule,
    EmailCampaignsModule,
    SeoModule,
    LocalizationModule,
    AffiliatesModule,
    SegmentsModule,
    AdvancedReportsModule,
    StaffModule,
    DesignModule,
    AiStudioModule,
    SupportModule,
    OtpModule,
    ShiprocketModule,
    PickupPointsModule,
    ShippingZonesModule,
  ],
})
export class AppModule {}
