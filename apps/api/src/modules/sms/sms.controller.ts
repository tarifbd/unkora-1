import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SmsService } from './sms.service';

@ApiTags('sms')
@Controller('sms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Get('logs')
  getLogs(@Query('status') status?: string, @Query('page') page?: number) {
    return this.smsService.getLogs({ status, page: page ? +page : 1 });
  }

  @Get('stats')
  getStats() {
    return this.smsService.getStats();
  }

  @Get('templates')
  getTemplates() {
    return this.smsService.getTemplates();
  }

  @Post('templates')
  createTemplate(@Body() dto: { name: string; content: string; variables?: string[] }) {
    return this.smsService.createTemplate(dto);
  }

  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() dto: any) {
    return this.smsService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string) {
    return this.smsService.deleteTemplate(id);
  }

  @Post('send')
  sendSms(@Body('phone') phone: string, @Body('message') message: string) {
    return this.smsService.sendSms(phone, message);
  }

  @Post('send-bulk')
  sendBulk(@Body('phones') phones: string[], @Body('message') message: string) {
    return this.smsService.sendBulk(phones, message);
  }
}
