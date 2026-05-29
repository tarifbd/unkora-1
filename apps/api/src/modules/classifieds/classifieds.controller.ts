import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClassifiedsService } from './classifieds.service';

@ApiTags('classifieds')
@Controller('classifieds')
export class ClassifiedsController {
  constructor(private readonly svc: ClassifiedsService) {}

  @Get() findAll(@Query('page') page=1, @Query('limit') limit=20, @Query('category') category?: string, @Query('search') search?: string) {
    return this.svc.findAll({ page: +page, limit: +limit, category, search });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myAds(@CurrentUser('id') userId: string) { return this.svc.myAds(userId); }

  @Get(':id') findById(@Param('id') id: string) { return this.svc.findById(id); }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@CurrentUser('id') userId: string, @Body() dto: any) { return this.svc.create(userId, dto); }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: any) { return this.svc.update(id, userId, dto); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) { return this.svc.delete(id, userId); }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  adminList(@Query('page') page=1, @Query('limit') limit=20, @Query('status') status?: string) {
    return this.svc.adminList({ page: +page, limit: +limit, status });
  }

  @Put('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  updateStatus(@Param('id') id: string, @CurrentUser('id') adminId: string, @Body('status') status: string) {
    return this.svc.update(id, adminId, { status }, true);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  adminDelete(@Param('id') id: string, @CurrentUser('id') adminId: string) { return this.svc.delete(id, adminId, true); }
}
