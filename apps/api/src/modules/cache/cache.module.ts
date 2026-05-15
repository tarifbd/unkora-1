import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        store: redisStore,
        url: config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
        ttl: 60,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppCacheModule {}
