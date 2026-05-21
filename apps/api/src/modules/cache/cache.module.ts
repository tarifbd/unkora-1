import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        const isProd = config.get<string>('NODE_ENV') === 'production';

        // Use Redis only in production or when REDIS_URL is explicitly set to a non-local server
        if (isProd && redisUrl) {
          const { redisStore } = await import('cache-manager-redis-yet');
          return { store: redisStore, url: redisUrl, ttl: 60 };
        }

        // In-memory cache for local development — no Redis required
        return { ttl: 60, max: 500 };
      },
      inject: [ConfigService],
    }),
  ],
})
export class AppCacheModule {}
