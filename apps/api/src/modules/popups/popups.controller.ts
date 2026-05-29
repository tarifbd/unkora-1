import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PopupsService } from './popups.service';

@ApiTags('popups')
@Controller('popups')
export class PopupsController {
  constructor(private readonly svc: PopupsService) {}

  @Get('active')
  getActive(@Query('page') page?: string) { return this.svc.getActive(page); }

  @Post(':id/view')
  recordView(@Param('id') id: string) { return this.svc.recordView(id); }

  @Post(':id/click')
  recordClick(@Param('id') id: string) { return this.svc.recordClick(id); }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  findAll() { return this.svc.findAll(); }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  create(@Body() dto: any) { return this.svc.create(dto); }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  delete(@Param('id') id: string) { return this.svc.delete(id); }
}
