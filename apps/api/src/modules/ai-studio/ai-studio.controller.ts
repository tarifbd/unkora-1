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
  async getSettings() {
    return { success: true, data: await this.svc.getSettings() };
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update AI settings' })
  async updateSettings(@Body() dto: AiSettingsDto) {
    return { success: true, data: await this.svc.updateSettings(dto) };
  }

  // ─── Provider Status ─────────────────────────────────────────────────────────

  @Get('providers/status')
  @ApiOperation({ summary: 'Get AI provider configuration status' })
  async getProviderStatus() {
    return { success: true, data: await this.svc.getProviderStatus() };
  }

  @Post('providers/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test current AI provider connectivity' })
  async testProvider() {
    return { success: true, data: await this.svc.testProvider() };
  }

  // ─── Generate ────────────────────────────────────────────────────────────────

  @Post('generate/product-content')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate product content (title, description, bullet points, etc.)' })
  async generateProductContent(
    @Body() dto: GenerateProductContentDto,
    @CurrentUser('id') userId: string,
  ) {
    return { success: true, data: await this.svc.generateProductContent(dto, userId) };
  }

  @Post('generate/product-seo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate complete product SEO data' })
  async generateProductSeo(
    @Body() dto: GenerateProductSeoDto,
    @CurrentUser('id') userId: string,
  ) {
    return { success: true, data: await this.svc.generateProductSeo(dto, userId) };
  }

  @Post('generate/category-seo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate category SEO data' })
  async generateCategorySeo(
    @Body() dto: GenerateCategorySeoDto,
    @CurrentUser('id') userId: string,
  ) {
    return { success: true, data: await this.svc.generateCategorySeo(dto, userId) };
  }

  @Post('generate/landing-page')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate landing page content' })
  async generateLandingPage(
    @Body() dto: GenerateLandingPageDto,
    @CurrentUser('id') userId: string,
  ) {
    return { success: true, data: await this.svc.generateLandingPage(dto, userId) };
  }

  @Post('generate/blog')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate blog article content' })
  async generateBlog(
    @Body() dto: GenerateBlogDto,
    @CurrentUser('id') userId: string,
  ) {
    return { success: true, data: await this.svc.generateBlog(dto, userId) };
  }

  @Post('generate/ad-copy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate ad copy for Google, Facebook, Instagram' })
  async generateAdCopy(
    @Body() dto: GenerateAdCopyDto,
    @CurrentUser('id') userId: string,
  ) {
    return { success: true, data: await this.svc.generateAdCopy(dto, userId) };
  }

  @Post('generate/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate email marketing copy' })
  async generateEmail(
    @Body() dto: GenerateEmailDto,
    @CurrentUser('id') userId: string,
  ) {
    return { success: true, data: await this.svc.generateEmailCopy(dto, userId) };
  }

  @Post('generate/faq')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate FAQ content with schema markup' })
  async generateFaq(
    @Body() dto: GenerateFaqDto,
    @CurrentUser('id') userId: string,
  ) {
    return { success: true, data: await this.svc.generateFaq(dto, userId) };
  }

  @Post('generate/image-alt-text')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate SEO-optimized image alt text' })
  async generateImageAltText(
    @Body() dto: GenerateImageAltDto,
    @CurrentUser('id') userId: string,
  ) {
    return { success: true, data: await this.svc.generateImageAltText(dto, userId) };
  }

  @Post('generate/custom')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Custom AI generation with your own prompt' })
  async generateCustom(
    @Body() dto: GenerateCustomDto,
    @CurrentUser('id') userId: string,
  ) {
    return { success: true, data: await this.svc.generateCustom(dto, userId) };
  }

  // ─── Logs ─────────────────────────────────────────────────────────────────────

  @Get('logs')
  @ApiOperation({ summary: 'Get AI generation logs' })
  async getLogs(
    @Query('featureType') featureType?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return {
      success: true,
      data: await this.svc.getLogs({
        featureType,
        status,
        page: +page,
        limit: +limit,
      }),
    };
  }

  // ─── Generated Contents ───────────────────────────────────────────────────────

  @Get('generated-contents')
  @ApiOperation({ summary: 'List saved generated content' })
  async listGeneratedContents(
    @Query('featureType') featureType?: string,
    @Query('status') status?: string,
    @Query('relatedEntityId') relatedEntityId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return {
      success: true,
      data: await this.svc.listGeneratedContents({
        featureType,
        status,
        relatedEntityId,
        page: +page,
        limit: +limit,
      }),
    };
  }

  @Get('generated-contents/:id')
  @ApiOperation({ summary: 'Get a specific generated content item' })
  async getGeneratedContent(@Param('id') id: string) {
    return { success: true, data: await this.svc.getGeneratedContent(id) };
  }

  @Post('generated-contents/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a generated content item' })
  async approveContent(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return { success: true, data: await this.svc.approveContent(id, userId) };
  }

  @Post('generated-contents/:id/apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark content as applied' })
  async applyContent(@Param('id') id: string) {
    return { success: true, data: await this.svc.applyContent(id) };
  }

  @Post('generated-contents/:id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a generated content item' })
  async archiveContent(@Param('id') id: string) {
    return { success: true, data: await this.svc.archiveContent(id) };
  }

  // ─── Agents ───────────────────────────────────────────────────────────────────

  @Get('agents')
  @ApiOperation({ summary: 'List AI agent integrations' })
  async listAgents() {
    return { success: true, data: await this.svc.listAgents() };
  }

  @Post('agents')
  @ApiOperation({ summary: 'Create a new AI agent integration' })
  async createAgent(@Body() dto: AgentIntegrationDto) {
    return { success: true, data: await this.svc.createAgent(dto) };
  }

  @Get('agents/:id')
  @ApiOperation({ summary: 'Get an AI agent integration' })
  async getAgent(@Param('id') id: string) {
    return { success: true, data: await this.svc.getAgent(id) };
  }

  @Patch('agents/:id')
  @ApiOperation({ summary: 'Update an AI agent integration' })
  async updateAgent(@Param('id') id: string, @Body() dto: Partial<AgentIntegrationDto>) {
    return { success: true, data: await this.svc.updateAgent(id, dto) };
  }

  @Delete('agents/:id')
  @ApiOperation({ summary: 'Delete an AI agent integration' })
  async deleteAgent(@Param('id') id: string) {
    await this.svc.deleteAgent(id);
    return { success: true, message: 'Agent deleted successfully' };
  }

  @Post('agents/:id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test an AI agent endpoint' })
  async testAgent(@Param('id') id: string) {
    return { success: true, data: await this.svc.testAgent(id) };
  }

  @Post('agents/:id/run-task')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run a task on an AI agent' })
  async runAgentTask(
    @Param('id') id: string,
    @Body() dto: AgentTaskDto,
    @CurrentUser('id') userId: string,
  ) {
    return { success: true, data: await this.svc.runAgentTask(id, dto, userId) };
  }

  @Get('agent-tasks')
  @ApiOperation({ summary: 'List agent tasks' })
  async listAgentTasks(@Query('agentId') agentId?: string) {
    return { success: true, data: await this.svc.listAgentTasks(agentId) };
  }
}
