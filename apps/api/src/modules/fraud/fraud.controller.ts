import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { FraudService } from './fraud.service';

@ApiTags('fraud')
@Controller('fraud')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get('blocked')
  @ApiOperation({ summary: 'List blocked entities (IPs, phones, devices)' })
  getBlocked(@Query('type') type?: string) {
    return this.fraudService.getBlockedEntities(type);
  }

  @Post('blocked')
  @ApiOperation({ summary: 'Block an entity' })
  block(@Body() dto: { type: string; value: string; reason?: string; blockedBy?: string }) {
    return this.fraudService.blockEntity(dto.type, dto.value, dto.reason, dto.blockedBy);
  }

  @Delete('blocked/:id')
  @ApiOperation({ summary: 'Unblock an entity' })
  unblock(@Param('id') id: string) {
    return this.fraudService.unblockEntity(id);
  }

  @Get('ip-clusters')
  @ApiOperation({ summary: 'Get IP address clusters (same IP, multiple orders)' })
  ipClusters() {
    return this.fraudService.getIpClusters();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get orders with tracking metadata' })
  ordersWithMeta(@Query('limit') limit?: string) {
    return this.fraudService.getOrdersWithMetadata(limit ? +limit : 200);
  }
}
