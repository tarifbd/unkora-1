import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AiProviderFactory } from './providers/ai-provider.factory';
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

@Injectable()
export class AiStudioService {
  private readonly logger = new Logger(AiStudioService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly providerFactory: AiProviderFactory,
  ) {}

  // ─── Settings ────────────────────────────────────────────────────────────────

  async getSettings() {
    return this.prisma.aiSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton' },
      update: {},
    });
  }

  async updateSettings(dto: AiSettingsDto) {
    return this.prisma.aiSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...dto },
      update: { ...dto },
    });
  }

  // ─── Provider Status ─────────────────────────────────────────────────────────

  async getProviderStatus() {
    const settings = await this.getSettings();
    const activeProvider = this.config.get<string>('AI_PROVIDER') ?? 'openai';
    const activeModel = this.config.get<string>('AI_MODEL') ?? 'gpt-4o-mini';
    const providerStatuses = this.providerFactory.getProviderStatus();

    return {
      activeProvider,
      activeModel,
      isEnabled: settings.isEnabled,
      providers: Object.fromEntries(
        Object.entries(providerStatuses).map(([key, val]) => [
          key,
          { ...val, active: key === activeProvider },
        ]),
      ),
    };
  }

  async testProvider() {
    const start = Date.now();
    try {
      const provider = this.providerFactory.getProvider();
      if (!provider.isConfigured()) {
        throw new BadRequestException(`Provider "${provider.name}" is not configured`);
      }
      const result = await provider.generateText(
        'Say "AI provider is working correctly" in exactly those words.',
        { maxTokens: 50 },
      );
      return { success: true, latencyMs: Date.now() - start, response: result };
    } catch (err: any) {
      return { success: false, latencyMs: Date.now() - start, error: err.message };
    }
  }

  // ─── Core generation helper ───────────────────────────────────────────────────

  private async generate(
    featureType: string,
    prompt: string,
    schemaDesc: string,
    userId?: string,
  ): Promise<Record<string, unknown>> {
    const settings = await this.getSettings();
    if (!settings.isEnabled) {
      throw new BadRequestException('AI generation is currently disabled. Enable it in AI settings.');
    }

    const provider = this.providerFactory.getProvider();
    if (!provider.isConfigured()) {
      throw new BadRequestException(
        `AI provider "${provider.name}" is not configured. Please set the API key in environment variables.`,
      );
    }

    const inputSummary = prompt.substring(0, 500);
    let result: Record<string, unknown>;
    let tokenOutput = 0;
    let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    let errorMessage: string | undefined;

    try {
      result = await provider.generateStructuredJSON<Record<string, unknown>>(
        prompt,
        schemaDesc,
        {
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          systemPrompt: settings.systemPrompt ?? undefined,
        },
      );
      tokenOutput = JSON.stringify(result).length / 4; // rough token estimate
    } catch (err: any) {
      status = 'FAILED';
      errorMessage = err.message;
      result = {};
    }

    // Log to DB (fire and forget for perf)
    this.prisma.aiGenerationLog
      .create({
        data: {
          userId,
          provider: provider.name,
          model: this.config.get<string>('AI_MODEL') ?? provider.name,
          featureType: featureType as any,
          inputSummary,
          outputSummary: JSON.stringify(result).substring(0, 500),
          tokenOutput: Math.round(tokenOutput),
          status: status as any,
          errorMessage,
        },
      })
      .catch((e) => this.logger.warn(`Failed to log AI generation: ${e.message}`));

    if (status === 'FAILED') {
      throw new BadRequestException(`AI generation failed: ${errorMessage}`);
    }

    return result;
  }

  // ─── Generation Methods ───────────────────────────────────────────────────────

  async generateProductContent(dto: GenerateProductContentDto, userId?: string) {
    const keywordsStr = dto.keywords?.join(', ') ?? '';
    const featuresStr = dto.features?.join(', ') ?? '';
    const benefitsStr = dto.benefits?.join(', ') ?? '';

    const prompt = `Generate comprehensive product content for an e-commerce product.

Product Name: ${dto.productName}
${dto.category ? `Category: ${dto.category}` : ''}
${dto.brand ? `Brand: ${dto.brand}` : ''}
${featuresStr ? `Features: ${featuresStr}` : ''}
${benefitsStr ? `Benefits: ${benefitsStr}` : ''}
${dto.targetAudience ? `Target Audience: ${dto.targetAudience}` : ''}
${dto.tone ? `Tone: ${dto.tone}` : 'Tone: Professional and engaging'}
${dto.language ? `Language: ${dto.language}` : 'Language: English'}
${keywordsStr ? `Keywords to include: ${keywordsStr}` : ''}

Return a JSON object with these exact keys:
{
  "titleSuggestions": ["title1", "title2", "title3"],
  "shortDescription": "20-30 word product summary",
  "longDescription": "150-200 word detailed description",
  "bulletPoints": ["feature1", "feature2", "feature3", "feature4", "feature5"],
  "faq": [{"question": "...", "answer": "..."}, {"question": "...", "answer": "..."}],
  "callToAction": "compelling CTA text",
  "seoTitle": "SEO optimized title 50-60 chars",
  "seoDescription": "Meta description 120-160 chars",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

    const schemaDesc = 'Product content with titleSuggestions[], shortDescription, longDescription, bulletPoints[], faq[], callToAction, seoTitle, seoDescription, seoKeywords[]';
    return this.generate('PRODUCT_CONTENT', prompt, schemaDesc, userId);
  }

  async generateProductSeo(dto: GenerateProductSeoDto, userId?: string) {
    const targetKwStr = dto.targetKeywords?.join(', ') ?? '';
    const secondaryKwStr = dto.secondaryKeywords?.join(', ') ?? '';

    const prompt = `Generate complete SEO optimization data for a product page.

Product Name: ${dto.productName}
${dto.category ? `Category: ${dto.category}` : ''}
${targetKwStr ? `Target Keywords: ${targetKwStr}` : ''}
${secondaryKwStr ? `Secondary Keywords: ${secondaryKwStr}` : ''}
${dto.language ? `Language: ${dto.language}` : 'Language: English'}
${dto.searchIntent ? `Search Intent: ${dto.searchIntent}` : ''}

Return JSON with these exact keys:
{
  "seoTitle": "optimized title 50-60 chars with primary keyword",
  "metaDescription": "compelling meta description 120-160 chars",
  "slugSuggestions": ["slug-one", "slug-two", "slug-three"],
  "h1": "main heading with keyword",
  "h2Sections": ["section heading 1", "section heading 2", "section heading 3"],
  "keywordList": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "faqSchema": {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "...", "acceptedAnswer": {"@type": "Answer", "text": "..."}}]},
  "productSchemaSuggestion": {"@type": "Product", "name": "...", "description": "..."},
  "imageAltTexts": ["alt text for main image", "alt text for secondary image"],
  "internalLinkSuggestions": [{"anchorText": "...", "suggestedTarget": "..."}]
}`;

    const schemaDesc = 'SEO data with seoTitle, metaDescription, slugSuggestions[], h1, h2Sections[], keywordList[], faqSchema{}, productSchemaSuggestion{}, imageAltTexts[], internalLinkSuggestions[]';
    return this.generate('PRODUCT_SEO', prompt, schemaDesc, userId);
  }

  async generateCategorySeo(dto: GenerateCategorySeoDto, userId?: string) {
    const targetKwStr = dto.targetKeywords?.join(', ') ?? '';

    const prompt = `Generate comprehensive SEO data for a product category page.

Category Name: ${dto.categoryName}
${dto.description ? `Existing Description: ${dto.description}` : ''}
${dto.parentCategory ? `Parent Category: ${dto.parentCategory}` : ''}
${targetKwStr ? `Target Keywords: ${targetKwStr}` : ''}
${dto.language ? `Language: ${dto.language}` : 'Language: English'}

Return JSON with:
{
  "seoTitle": "category page title 50-60 chars",
  "metaDescription": "meta description 120-160 chars",
  "slug": "category-slug",
  "h1": "main category heading",
  "categoryDescription": "150-200 word SEO-rich category description",
  "breadcrumbSchema": {"@type": "BreadcrumbList", "itemListElement": []},
  "keywordList": ["keyword1", "keyword2", "keyword3"],
  "internalLinkSuggestions": [{"anchorText": "...", "suggestedTarget": "..."}]
}`;

    const schemaDesc = 'Category SEO data with seoTitle, metaDescription, slug, h1, categoryDescription, breadcrumbSchema{}, keywordList[], internalLinkSuggestions[]';
    return this.generate('CATEGORY_SEO', prompt, schemaDesc, userId);
  }

  async generateLandingPage(dto: GenerateLandingPageDto, userId?: string) {
    const sectionsStr = dto.sectionsRequired?.join(', ') ?? 'Hero, Features, Benefits, Testimonials, CTA';

    const prompt = `Generate a complete landing page content structure for:

Product/Offer: ${dto.productOrOffer}
${dto.targetAudience ? `Target Audience: ${dto.targetAudience}` : ''}
${dto.mainGoal ? `Main Goal: ${dto.mainGoal}` : ''}
${dto.tone ? `Tone: ${dto.tone}` : 'Tone: Persuasive and professional'}
${dto.language ? `Language: ${dto.language}` : 'Language: English'}
${dto.brandStyle ? `Brand Style: ${dto.brandStyle}` : ''}
Sections Required: ${sectionsStr}

Return JSON with:
{
  "pageTitle": "compelling page title",
  "metaDescription": "120-160 char meta description",
  "heroHeadline": "attention-grabbing headline",
  "heroSubheadline": "supporting subheadline",
  "heroCtaText": "CTA button text",
  "sections": [{"name": "section name", "headline": "...", "content": "...", "ctaText": "..."}],
  "socialProofPoints": ["proof point 1", "proof point 2"],
  "trustSignals": ["trust signal 1", "trust signal 2"],
  "faq": [{"question": "...", "answer": "..."}],
  "footerCta": "final call to action text"
}`;

    const schemaDesc = 'Landing page with pageTitle, metaDescription, heroHeadline, heroSubheadline, heroCtaText, sections[], socialProofPoints[], trustSignals[], faq[], footerCta';
    return this.generate('LANDING_PAGE', prompt, schemaDesc, userId);
  }

  async generateBlog(dto: GenerateBlogDto, userId?: string) {
    const keywordsStr = dto.keywords?.join(', ') ?? '';

    const prompt = `Generate a complete blog article outline and content for:

Title: ${dto.title}
${dto.topic ? `Topic/Focus: ${dto.topic}` : ''}
${keywordsStr ? `Target Keywords: ${keywordsStr}` : ''}
${dto.tone ? `Tone: ${dto.tone}` : 'Tone: Informative and engaging'}
${dto.wordCount ? `Target Word Count: ${dto.wordCount}` : 'Target Word Count: 800-1000'}
${dto.language ? `Language: ${dto.language}` : 'Language: English'}

Return JSON with:
{
  "seoTitle": "SEO optimized blog title 50-60 chars",
  "metaDescription": "blog meta description 120-160 chars",
  "slug": "blog-url-slug",
  "introduction": "compelling 100-150 word introduction",
  "tableOfContents": ["section 1", "section 2", "section 3"],
  "sections": [{"heading": "...", "content": "...", "wordCount": 200}],
  "conclusion": "100-word conclusion with CTA",
  "tags": ["tag1", "tag2", "tag3"],
  "schemaMarkup": {"@type": "Article", "headline": "...", "description": "..."}
}`;

    const schemaDesc = 'Blog article with seoTitle, metaDescription, slug, introduction, tableOfContents[], sections[], conclusion, tags[], schemaMarkup{}';
    return this.generate('BLOG_ARTICLE', prompt, schemaDesc, userId);
  }

  async generateAdCopy(dto: GenerateAdCopyDto, userId?: string) {
    const prompt = `Generate high-converting advertising copy for:

Product: ${dto.product}
${dto.platform ? `Platform: ${dto.platform}` : 'Platform: Google Ads and Facebook Ads'}
${dto.audience ? `Target Audience: ${dto.audience}` : ''}
${dto.tone ? `Tone: ${dto.tone}` : 'Tone: Compelling and action-oriented'}
${dto.usp ? `Unique Selling Proposition: ${dto.usp}` : ''}

Return JSON with:
{
  "googleAds": {
    "headlines": ["headline1 max 30 chars", "headline2 max 30 chars", "headline3 max 30 chars"],
    "descriptions": ["description1 max 90 chars", "description2 max 90 chars"],
    "calloutExtensions": ["callout1", "callout2", "callout3"]
  },
  "facebookAds": {
    "primaryText": "main ad copy 125 chars",
    "headline": "ad headline max 40 chars",
    "description": "ad description max 30 chars",
    "cta": "CTA button text"
  },
  "instagramCaption": "instagram post caption with hashtags",
  "twitterPost": "twitter post max 280 chars"
}`;

    const schemaDesc = 'Ad copy with googleAds{headlines[], descriptions[], calloutExtensions[]}, facebookAds{primaryText, headline, description, cta}, instagramCaption, twitterPost';
    return this.generate('AD_COPY', prompt, schemaDesc, userId);
  }

  async generateEmailCopy(dto: GenerateEmailDto, userId?: string) {
    const prompt = `Generate professional email copy for:

Email Type: ${dto.emailType}
${dto.subject ? `Subject Line: ${dto.subject}` : ''}
${dto.product ? `Featured Product/Service: ${dto.product}` : ''}
${dto.audience ? `Target Audience: ${dto.audience}` : ''}
${dto.tone ? `Tone: ${dto.tone}` : 'Tone: Professional and engaging'}

Return JSON with:
{
  "subjectLine": "compelling email subject",
  "previewText": "email preview text max 90 chars",
  "greeting": "personalized greeting",
  "bodyParagraphs": ["paragraph 1", "paragraph 2", "paragraph 3"],
  "ctaText": "CTA button text",
  "ctaUrl": "/shop/product-url",
  "signoff": "professional sign-off",
  "psLine": "P.S. follow-up line for urgency"
}`;

    const schemaDesc = 'Email copy with subjectLine, previewText, greeting, bodyParagraphs[], ctaText, ctaUrl, signoff, psLine';
    return this.generate('EMAIL_COPY', prompt, schemaDesc, userId);
  }

  async generateFaq(dto: GenerateFaqDto, userId?: string) {
    const count = dto.count ?? 5;

    const prompt = `Generate ${count} frequently asked questions and detailed answers for:

Topic: ${dto.topic}
${dto.audience ? `Target Audience: ${dto.audience}` : ''}
${dto.language ? `Language: ${dto.language}` : 'Language: English'}

Create questions that real customers commonly ask. Make answers helpful, clear, and concise.

Return JSON with:
{
  "faqs": [
    {"question": "What is...?", "answer": "Detailed answer..."},
    {"question": "How does...?", "answer": "Detailed answer..."}
  ],
  "schemaMarkup": {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{"@type": "Question", "name": "...", "acceptedAnswer": {"@type": "Answer", "text": "..."}}]
  }
}`;

    const schemaDesc = 'FAQ data with faqs[] containing question and answer, and schemaMarkup{} for structured data';
    return this.generate('FAQ', prompt, schemaDesc, userId);
  }

  async generateImageAltText(dto: GenerateImageAltDto, userId?: string) {
    const prompt = `Generate SEO-optimized image alt text and title attributes.

Image URL: ${dto.imageUrl}
${dto.context ? `Context/Purpose: ${dto.context}` : ''}
${dto.product ? `Product Name: ${dto.product}` : ''}
${dto.category ? `Category: ${dto.category}` : ''}

Return JSON with:
{
  "altText": "descriptive alt text under 125 chars",
  "titleText": "image title attribute",
  "suggestions": ["alternative alt text 1", "alternative alt text 2", "alternative alt text 3"],
  "seoNotes": "brief note on why this alt text is effective"
}`;

    const schemaDesc = 'Image alt text with altText, titleText, suggestions[], seoNotes';
    return this.generate('IMAGE_ALT_TEXT', prompt, schemaDesc, userId);
  }

  async generateCustom(dto: GenerateCustomDto, userId?: string) {
    const prompt = dto.outputFormat
      ? `${dto.prompt}\n\nProvide the output in ${dto.outputFormat} format.`
      : dto.prompt;

    const schemaDesc = 'Custom output based on the provided prompt';
    return this.generate('CUSTOM_PROMPT', prompt, schemaDesc, userId);
  }

  // ─── Content Library ─────────────────────────────────────────────────────────

  async saveGeneratedContent(data: {
    featureType: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    title: string;
    contentJson: Record<string, unknown>;
    contentText: string;
    generatedBy?: string;
  }) {
    return this.prisma.aiGeneratedContent.create({
      data: {
        featureType: data.featureType as any,
        relatedEntityType: data.relatedEntityType as any,
        relatedEntityId: data.relatedEntityId,
        title: data.title,
        contentJson: data.contentJson as Prisma.InputJsonValue,
        contentText: data.contentText,
        generatedBy: data.generatedBy,
      },
    });
  }

  async listGeneratedContents(params: {
    featureType?: string;
    status?: string;
    relatedEntityId?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (params.featureType) where.featureType = params.featureType;
    if (params.status) where.status = params.status;
    if (params.relatedEntityId) where.relatedEntityId = params.relatedEntityId;

    const [data, total] = await Promise.all([
      this.prisma.aiGeneratedContent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.aiGeneratedContent.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getGeneratedContent(id: string) {
    const content = await this.prisma.aiGeneratedContent.findUnique({ where: { id } });
    if (!content) throw new NotFoundException('Generated content not found');
    return content;
  }

  async approveContent(id: string, approvedBy?: string) {
    await this.getGeneratedContent(id);
    return this.prisma.aiGeneratedContent.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy },
    });
  }

  async applyContent(id: string) {
    await this.getGeneratedContent(id);
    return this.prisma.aiGeneratedContent.update({
      where: { id },
      data: { status: 'APPLIED', appliedAt: new Date() },
    });
  }

  async archiveContent(id: string) {
    await this.getGeneratedContent(id);
    return this.prisma.aiGeneratedContent.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  // ─── Logs ─────────────────────────────────────────────────────────────────────

  async getLogs(params: {
    featureType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50 } = params;
    const where: Record<string, unknown> = {};
    if (params.featureType) where.featureType = params.featureType;
    if (params.status) where.status = params.status;

    const [data, total] = await Promise.all([
      this.prisma.aiGenerationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.aiGenerationLog.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Templates ────────────────────────────────────────────────────────────────

  async listTemplates() {
    return this.prisma.aiTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTemplate(dto: {
    name: string;
    featureType: string;
    promptTemplate: string;
    outputSchemaJson?: Record<string, unknown>;
    createdBy?: string;
  }) {
    return this.prisma.aiTemplate.create({
      data: {
        name: dto.name,
        featureType: dto.featureType as any,
        promptTemplate: dto.promptTemplate,
        outputSchemaJson: dto.outputSchemaJson as Prisma.InputJsonValue | undefined,
        createdBy: dto.createdBy,
      },
    });
  }

  async updateTemplate(
    id: string,
    dto: Partial<{
      name: string;
      promptTemplate: string;
      outputSchemaJson: Record<string, unknown>;
      isActive: boolean;
    }>,
  ) {
    const template = await this.prisma.aiTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    return this.prisma.aiTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.promptTemplate !== undefined && { promptTemplate: dto.promptTemplate }),
        ...(dto.outputSchemaJson !== undefined && { outputSchemaJson: dto.outputSchemaJson as Prisma.InputJsonValue }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  // ─── Agents ───────────────────────────────────────────────────────────────────

  async listAgents() {
    return this.prisma.aiAgentIntegration.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAgent(dto: AgentIntegrationDto) {
    return this.prisma.aiAgentIntegration.create({
      data: {
        name: dto.name,
        provider: dto.provider,
        agentType: dto.agentType as any,
        description: dto.description,
        endpointUrl: dto.endpointUrl,
        apiKeyEnvName: dto.apiKeyEnvName,
        isEnabled: dto.isEnabled ?? false,
        configJson: dto.configJson as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async getAgent(id: string) {
    const agent = await this.prisma.aiAgentIntegration.findUnique({
      where: { id },
      include: { tasks: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async updateAgent(id: string, dto: Partial<AgentIntegrationDto>) {
    await this.getAgent(id);
    return this.prisma.aiAgentIntegration.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.provider !== undefined && { provider: dto.provider }),
        ...(dto.agentType !== undefined && { agentType: dto.agentType as any }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.endpointUrl !== undefined && { endpointUrl: dto.endpointUrl }),
        ...(dto.apiKeyEnvName !== undefined && { apiKeyEnvName: dto.apiKeyEnvName }),
        ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
        ...(dto.configJson !== undefined && { configJson: dto.configJson as Prisma.InputJsonValue }),
      },
    });
  }

  async deleteAgent(id: string) {
    await this.getAgent(id);
    await this.prisma.aiAgentTask.deleteMany({ where: { agentIntegrationId: id } });
    return this.prisma.aiAgentIntegration.delete({ where: { id } });
  }

  async testAgent(id: string) {
    const agent = await this.getAgent(id);
    if (!agent.endpointUrl) {
      return { success: false, error: 'Agent has no endpoint URL configured' };
    }
    return {
      success: true,
      message: `Agent "${agent.name}" endpoint reachability check: endpoint URL is set to ${agent.endpointUrl}`,
    };
  }

  async runAgentTask(agentId: string, dto: AgentTaskDto, createdBy?: string) {
    const agent = await this.getAgent(agentId);
    if (!agent.isEnabled) {
      throw new BadRequestException(`Agent "${agent.name}" is not enabled`);
    }

    return this.prisma.aiAgentTask.create({
      data: {
        agentIntegrationId: agentId,
        taskType: dto.taskType,
        status: 'PENDING',
        inputJson: dto.inputJson as Prisma.InputJsonValue,
        createdBy,
      },
    });
  }

  async listAgentTasks(agentId?: string) {
    const where = agentId ? { agentIntegrationId: agentId } : {};
    return this.prisma.aiAgentTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { agent: { select: { id: true, name: true, agentType: true } } },
    });
  }

  // ─── Legacy compatibility ─────────────────────────────────────────────────────

  async generateFromTemplate(template: string, variables: Record<string, string>): Promise<string> {
    let prompt = template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    const provider = this.providerFactory.getProvider();
    return provider.generateText(prompt);
  }
}
