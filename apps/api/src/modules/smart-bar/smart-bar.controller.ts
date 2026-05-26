import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SmartBarService } from './smart-bar.service';
import { CreateSmartBarDto } from './dto/create-smart-bar.dto';
import { UpdateSmartBarDto } from './dto/update-smart-bar.dto';

@ApiTags('smart-bar')
@Controller('smart-bar')
export class SmartBarController {
  constructor(private readonly smartBarService: SmartBarService) {}

  @Get('active')
  findActive() {
    return this.smartBarService.findActive();
  }

  @Get('product/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  findByProduct(@Param('productId') productId: string) {
    return this.smartBarService.findByProduct(productId);
  }

  @Post('product/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  create(@Param('productId') productId: string, @Body() dto: CreateSmartBarDto) {
    return this.smartBarService.create(productId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdateSmartBarDto) {
    return this.smartBarService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.smartBarService.remove(id);
  }
}
