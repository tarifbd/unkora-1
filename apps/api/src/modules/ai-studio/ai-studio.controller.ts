import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AiStudioService } from './ai-studio.service';

@ApiTags('ai-studio')
@Controller('ai-studio')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class AiStudioController {
  constructor(private readonly svc: AiStudioService) {}

  @Post('generate-product')
  @ApiOperation({ summary: 'Generate product content with AI' })
  generateProduct(@Body() dto: { productName: string; category?: string }) {
    return this.svc.generateProductContent(dto.productName, dto.category);
  }

  @Post('generate-from-template')
  @ApiOperation({ summary: 'Generate text from a saved prompt template' })
  generateFromTemplate(
    @Body() dto: { template: string; variables?: Record<string, string> },
  ) {
    return this.svc.generateFromTemplate(dto.template, dto.variables ?? {});
  }
}
