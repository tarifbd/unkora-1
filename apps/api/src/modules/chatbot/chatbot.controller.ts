import {
  BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ChatbotService } from './chatbot.service';

@ApiTags('chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly svc: ChatbotService) {}

  // ── Public endpoints ─────────────────────────────────────

  @Get('config')
  @ApiOperation({ summary: 'Public chatbot/contact widget config' })
  getConfig() {
    return this.svc.getPublicConfig();
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create a chat session' })
  createSession(@Body() dto: { visitorId?: string }) {
    return this.svc.createSession({ visitorId: dto?.visitorId });
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get a chat session with message history' })
  getSession(@Param('id') id: string) {
    return this.svc.getSession(id);
  }

  @Post('sessions/:id/messages')
  @ApiOperation({ summary: 'Send a message to Unkora AI' })
  sendMessage(@Param('id') id: string, @Body() dto: { message?: string }) {
    const message = dto?.message?.trim();
    if (!message) throw new BadRequestException('Message is required');
    if (message.length > 2000) throw new BadRequestException('Message is too long (max 2000 characters)');
    return this.svc.sendMessage(id, message);
  }

  // ── Admin endpoints ──────────────────────────────────────

  @Get('admin/sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] List chat sessions' })
  getAdminSessions(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.svc.getAdminSessions({ page: +page, limit: +limit });
  }

  @Post('admin/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Save chatbot/contact widget config' })
  saveConfig(@Body() body: Record<string, string>) {
    return this.svc.saveConfig(body);
  }
}
