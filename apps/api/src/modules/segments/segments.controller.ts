import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
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
  constructor(private readonly segmentsService: SegmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all computed segments' })
  getSegments() {
    return this.segmentsService.getSegmentOverview();
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get segment counts overview' })
  getOverview() {
    return this.segmentsService.getSegmentOverview();
  }

  @Get(':segment/users')
  @ApiOperation({ summary: 'List users in a segment' })
  getUsersInSegment(
    @Param('segment') segment: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.segmentsService.getUsersInSegment(segment, +page, +limit);
  }
}
