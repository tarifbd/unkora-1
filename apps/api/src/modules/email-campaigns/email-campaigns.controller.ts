import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateEmailCampaignDto,
  EmailCampaignsService,
  UpdateEmailCampaignDto,
} from './email-campaigns.service';

@ApiTags('email-campaigns')
@Controller('email-campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class EmailCampaignsController {
  constructor(private readonly emailCampaignsService: EmailCampaignsService) {}

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all email campaigns' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.emailCampaignsService.findAll({ page: +page, limit: +limit, status });
  }

  @Get('stats')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get email campaign stats' })
  getStats() {
    return this.emailCampaignsService.getStats();
  }

  @Get(':id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single email campaign' })
  findOne(@Param('id') id: string) {
    return this.emailCampaignsService.findOne(id);
  }

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create a new email campaign' })
  create(@Body() dto: CreateEmailCampaignDto) {
    return this.emailCampaignsService.create(dto);
  }

  @Put(':id')
  @Version('1')
  @ApiOperation({ summary: 'Update an email campaign' })
  update(@Param('id') id: string, @Body() dto: UpdateEmailCampaignDto) {
    return this.emailCampaignsService.update(id, dto);
  }

  @Post(':id/send')
  @Version('1')
  @ApiOperation({ summary: 'Send an email campaign' })
  send(@Param('id') id: string) {
    return this.emailCampaignsService.send(id);
  }

  @Delete(':id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an email campaign' })
  remove(@Param('id') id: string) {
    return this.emailCampaignsService.remove(id);
  }
}
