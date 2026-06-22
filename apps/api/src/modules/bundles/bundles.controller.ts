import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BundlesService } from './bundles.service';
import { CreateBundleDto } from './dto/create-bundle.dto';

@ApiTags('bundles')
@Controller('bundles')
export class BundlesController {
  constructor(private readonly bundlesService: BundlesService) {}

  @Get()
  @ApiOperation({ summary: 'Get active bundle offers (public)' })
  findActive() {
    return this.bundlesService.findActive();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all bundles' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.bundlesService.findAll({
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.bundlesService.findOne(id);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: create bundle offer' })
  create(@Body() dto: CreateBundleDto) {
    return this.bundlesService.create(dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: Partial<CreateBundleDto>) {
    return this.bundlesService.update(id, dto);
  }

  @Patch('admin/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: toggle active status' })
  toggle(@Param('id') id: string) {
    return this.bundlesService.toggle(id);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.bundlesService.remove(id);
  }
}
