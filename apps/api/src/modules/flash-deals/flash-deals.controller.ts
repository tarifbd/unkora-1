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
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateFlashDealDto } from './dto/create-flash-deal.dto';
import { UpdateFlashDealDto } from './dto/update-flash-deal.dto';
import { FlashDealsService } from './flash-deals.service';

@ApiTags('flash-deals')
@Controller('flash-deals')
export class FlashDealsController {
  constructor(private readonly flashDealsService: FlashDealsService) {}

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all currently active flash deals (storefront)' })
  findActive() {
    return this.flashDealsService.findActive();
  }

  @Get('admin')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all flash deals (paginated)' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.flashDealsService.findAll({ page: +page, limit: +limit });
  }

  @Post('admin')
  @Version('1')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: create a flash deal' })
  create(@Body() dto: CreateFlashDealDto) {
    return this.flashDealsService.create(dto);
  }

  @Patch('admin/:id')
  @Version('1')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: update a flash deal' })
  update(@Param('id') id: string, @Body() dto: UpdateFlashDealDto) {
    return this.flashDealsService.update(id, dto);
  }

  @Delete('admin/:id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: delete a flash deal' })
  remove(@Param('id') id: string) {
    return this.flashDealsService.remove(id);
  }
}
