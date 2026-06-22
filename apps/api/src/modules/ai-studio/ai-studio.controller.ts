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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiStudioService } from './ai-studio.service';
import { GenerateProductContentDto } from './dto/generate-product-content.dto';
import { GenerateProductSeoDto } from './dto/generate-product-seo.dto';
import { GenerateCategorySeoDto } from './dto/generate-category-seo.dto';
import { GenerateLandingPageDto } from './dto/generate-landing-page.dto';
import { GenerateBlogDto } from './dto/generate-blog.dto';
import { GenerateAdCopyDto } from './dto/generate-ad-copy.dto';
import { GenerateEmailDto } from './dto/generate-email.dto';
import { GenerateFaqDto } from './dto/generate-faq.dto';
import { GenerateImageAltDto } from './dto/generate-image-alt.dto';
import { GenerateCustomDto } from './dto/generate-custom.dto';
import { AiSettingsDto } from './dto/ai-settings.dto';
import { AgentIntegrationDto } from './dto/agent-integration.dto';
import { AgentTaskDto } from './dto/agent-task.dto';

@ApiTags('admin/ai')
@Controller('admin/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class AiStudioController {
  constructor(private readonly svc: AiStudioService) {}

  // ─── Settings ────────────────────────────────────────────────────────────────

  @Get('settings')
  @ApiOperation({ summary: 'Get AI settings' })
  getSettings() {
    return this.svc.getSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update AI settings' })
  updateSettings(@Body() dto: AiSettingsDto) {
    return this.svc.updateSettings(dto);
  }

  // ─── Provider Status ─────────────────────────────────────────────────────────

  @Get('providers/status')
  @ApiOperation({ summary: 'Get AI provider configuration status' })
  getProviderStatus() {
    return this.svc.getProviderStatus();
  }

  @Post('providers/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test current AI provider connectivity' })
  testProvider() {
    return this.svc.testProvider();
  }

  // ─── Generate ────────────────────────────────────────────────────────────────

  @Post('generate/product-content')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate product content' })
  generateProductContent(
    @Body() dto: GenerateProductContentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.generateProductContent(dto, userId);
  }

  @Post('generate/product-seo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate complete product SEO data' })
  generateProductSeo(
    @Body() dto: GenerateProductSeoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.generateProductSeo(dto, userId);
  }

  @Post('generate/category-seo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate category SEO data' })
  generateCategorySeo(
    @Body() dto: GenerateCategorySeoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.generateCategorySeo(dto, userId);
  }

  @Post('generate/landing-page')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate landing page content' })
  generateLandingPage(
    @Body() dto: GenerateLandingPageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.generateLandingPage(dto, userId);
  }

  @Post('generate/blog')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate blog article content' })
  generateBlog(
    @Body() dto: GenerateBlogDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.generateBlog(dto, userId);
  }

  @Post('generate/ad-copy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate ad copy' })
  generateAdCopy(
    @Body() dto: GenerateAdCopyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.generateAdCopy(dto, userId);
  }

  @Post('generate/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate email marketing copy' })
  generateEmail(
    @Body() dto: GenerateEmailDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.generateEmailCopy(dto, userId);
  }

  @Post('generate/faq')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate FAQ content with schema markup' })
  generateFaq(
    @Body() dto: GenerateFaqDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.generateFaq(dto, userId);
  }

  @Post('generate/image-alt-text')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate SEO-optimized image alt text' })
  generateImageAltText(
    @Body() dto: GenerateImageAltDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.generateImageAltText(dto, userId);
  }

  @Post('generate/custom')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Custom AI generation' })
  generateCustom(
    @Body() dto: GenerateCustomDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.generateCustom(dto, userId);
  }

  // ─── Logs ─────────────────────────────────────────────────────────────────────

  @Get('logs')
  @ApiOperation({ summary: 'Get AI generation logs' })
  getLogs(
    @Query('featureType') featureType?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.svc.getLogs({ featureType, status, page: +page, limit: +limit });
  }

  // ─── Generated Contents ───────────────────────────────────────────────────────

  @Get('generated-contents')
  @ApiOperation({ summary: 'List saved generated content' })
  listGeneratedContents(
    @Query('featureType') featureType?: string,
    @Query('status') status?: string,
    @Query('relatedEntityId') relatedEntityId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.listGeneratedContents({ featureType, status, relatedEntityId, page: +page, limit: +limit });
  }

  @Get('generated-contents/:id')
  @ApiOperation({ summary: 'Get a specific generated content item' })
  getGeneratedContent(@Param('id') id: string) {
    return this.svc.getGeneratedContent(id);
  }

  @Post('generated-contents/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a generated content item' })
  approveContent(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.svc.approveContent(id, userId);
  }

  @Post('generated-contents/:id/apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark content as applied' })
  applyContent(@Param('id') id: string) {
    return this.svc.applyContent(id);
  }

  @Post('generated-contents/:id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a generated content item' })
  archiveContent(@Param('id') id: string) {
    return this.svc.archiveContent(id);
  }

  // ─── Agents ───────────────────────────────────────────────────────────────────

  @Get('agents')
  @ApiOperation({ summary: 'List AI agent integrations' })
  listAgents() {
    return this.svc.listAgents();
  }

  @Post('agents')
  @ApiOperation({ summary: 'Create a new AI agent integration' })
  createAgent(@Body() dto: AgentIntegrationDto) {
    return this.svc.createAgent(dto);
  }

  @Get('agents/:id')
  @ApiOperation({ summary: 'Get an AI agent integration' })
  getAgent(@Param('id') id: string) {
    return this.svc.getAgent(id);
  }

  @Patch('agents/:id')
  @ApiOperation({ summary: 'Update an AI agent integration' })
  updateAgent(@Param('id') id: string, @Body() dto: Partial<AgentIntegrationDto>) {
    return this.svc.updateAgent(id, dto);
  }

  @Delete('agents/:id')
  @ApiOperation({ summary: 'Delete an AI agent integration' })
  async deleteAgent(@Param('id') id: string) {
    await this.svc.deleteAgent(id);
    return { deleted: true };
  }

  @Post('agents/:id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test an AI agent endpoint' })
  testAgent(@Param('id') id: string) {
    return this.svc.testAgent(id);
  }

  @Post('agents/:id/run-task')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run a task on an AI agent' })
  runAgentTask(
    @Param('id') id: string,
    @Body() dto: AgentTaskDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.runAgentTask(id, dto, userId);
  }

  @Get('agent-tasks')
  @ApiOperation({ summary: 'List agent tasks' })
  listAgentTasks(@Query('agentId') agentId?: string) {
    return this.svc.listAgentTasks(agentId);
  }
}
