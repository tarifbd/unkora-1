import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeliveryBoyStatus } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DeliveryBoysService } from './delivery-boys.service';
import { AssignOrderDto } from './dto/assign-order.dto';
import { CreateDeliveryBoyDto } from './dto/create-delivery-boy.dto';
import { UpdateDeliveryBoyDto } from './dto/update-delivery-boy.dto';

@ApiTags('delivery-boys')
@ApiBearerAuth()
@Controller('delivery-boys')
export class DeliveryBoysController {
  constructor(private readonly deliveryBoysService: DeliveryBoysService) {}

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delivery boy: get my assigned orders' })
  getMyOrders(@CurrentUser() user: { id: string }) {
    return this.deliveryBoysService.getMyOrders(user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: list all delivery boys (paginated)' })
  findAll(
    @Query('status') status?: DeliveryBoyStatus,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.deliveryBoysService.findAll({
      status,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin: create a delivery boy (creates user + profile)' })
  create(@Body() dto: CreateDeliveryBoyDto) {
    return this.deliveryBoysService.create(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: get delivery boy detail' })
  findOne(@Param('id') id: string) {
    return this.deliveryBoysService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: update delivery boy profile' })
  update(@Param('id') id: string, @Body() dto: UpdateDeliveryBoyDto) {
    return this.deliveryBoysService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: deactivate a delivery boy (soft delete)' })
  remove(@Param('id') id: string) {
    return this.deliveryBoysService.remove(id);
  }

  @Post(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin: assign an order to a delivery boy' })
  assignOrder(@Param('id') id: string, @Body() dto: AssignOrderDto) {
    return this.deliveryBoysService.assignOrder(id, dto);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin: mark a delivery as complete' })
  completeDelivery(@Param('id') id: string, @Body() dto: AssignOrderDto) {
    return this.deliveryBoysService.completeDelivery(id, dto);
  }
}
