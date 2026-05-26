import {
  Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SegmentsService } from './segments.service';

@ApiTags('segments')
@Controller('segments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class SegmentsController {
  constructor(private readonly svc: SegmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all segments (built-in computed + saved custom)' })
  getAll() {
    return this.svc.getSegmentOverview();
  }

  @Get('saved')
  @ApiOperation({ summary: 'List saved custom segments' })
  listSaved() {
    return this.svc.listSaved();
  }

  @Post()
  @ApiOperation({ summary: 'Create a saved custom segment' })
  create(@Body() dto: { name: string; description?: string; color?: string; rules?: object }) {
    return this.svc.createSegment(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a saved segment' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateSegment(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saved segment' })
  remove(@Param('id') id: string) {
    return this.svc.deleteSegment(id);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Sync users into a saved segment' })
  sync(@Param('id') id: string, @Body() dto: { userIds: string[] }) {
    return this.svc.syncSegmentMembers(id, dto.userIds);
  }

  @Get(':segment/users')
  @ApiOperation({ summary: 'List users in a segment (built-in or custom:id)' })
  getUsersInSegment(
    @Param('segment') segment: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.getUsersInSegment(segment, +page, +limit);
  }
}
