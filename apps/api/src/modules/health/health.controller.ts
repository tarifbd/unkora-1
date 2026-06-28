import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { PrismaService } from '../../database/prisma.service';

@ApiTags('health')
@Controller('health')
@SkipThrottle() // uptime monitors / load balancers poll this frequently
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check' })
  async check() {
    let dbStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: { database: dbStatus },
    };
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe — process is up (no dependencies checked)' })
  live() {
    // Liveness: the process is running and able to serve requests.
    // Must not depend on external services so the orchestrator does not
    // restart a healthy pod when a downstream dependency is degraded.
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe — dependencies (database) are reachable' })
  async ready() {
    // Readiness: only route traffic once required dependencies are reachable.
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        services: { database: 'error' },
      });
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: { database: 'ok' },
    };
  }
}
