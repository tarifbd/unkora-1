import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { WhatsAppService } from './whatsapp.service';

@ApiTags('whatsapp')
@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a WhatsApp message to a phone number' })
  send(@Body() dto: { to: string; message: string }) {
    return this.whatsAppService.sendText({ to: dto.to, text: dto.message });
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Broadcast a message to multiple phones' })
  broadcast(@Body() dto: { phones: string[]; message: string }) {
    return this.whatsAppService.sendBulk(dto.phones, dto.message);
  }
}
