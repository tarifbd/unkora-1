import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LocalizationService } from './localization.service';

@ApiTags('localization')
@Controller('localization')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class LocalizationController {
  constructor(private readonly localizationService: LocalizationService) {}

  // ─── Currencies ───────────────────────────────────────────────

  @Get('currencies')
  @ApiOperation({ summary: 'List all currencies' })
  getCurrencies() {
    return this.localizationService.getCurrencies();
  }

  @Post('currencies')
  @ApiOperation({ summary: 'Create a currency' })
  createCurrency(
    @Body() body: { code: string; name: string; symbol: string; rate?: number; isActive?: boolean },
  ) {
    return this.localizationService.createCurrency(body);
  }

  @Patch('currencies/:id')
  @ApiOperation({ summary: 'Update a currency' })
  updateCurrency(
    @Param('id') id: string,
    @Body() body: Partial<{ code: string; name: string; symbol: string; rate: number; isActive: boolean }>,
  ) {
    return this.localizationService.updateCurrency(id, body);
  }

  @Delete('currencies/:id')
  @ApiOperation({ summary: 'Delete a currency' })
  deleteCurrency(@Param('id') id: string) {
    return this.localizationService.deleteCurrency(id);
  }

  @Patch('currencies/:id/set-default')
  @ApiOperation({ summary: 'Set default currency' })
  setDefaultCurrency(@Param('id') id: string) {
    return this.localizationService.setDefaultCurrency(id);
  }

  // ─── Languages ────────────────────────────────────────────────

  @Get('languages')
  @ApiOperation({ summary: 'List all languages' })
  getLanguages() {
    return this.localizationService.getLanguages();
  }

  @Post('languages')
  @ApiOperation({ summary: 'Create a language' })
  createLanguage(
    @Body() body: { code: string; name: string; nativeName: string; isRtl?: boolean; isActive?: boolean },
  ) {
    return this.localizationService.createLanguage(body);
  }

  @Patch('languages/:id')
  @ApiOperation({ summary: 'Update a language' })
  updateLanguage(
    @Param('id') id: string,
    @Body() body: Partial<{ code: string; name: string; nativeName: string; isRtl: boolean; isActive: boolean }>,
  ) {
    return this.localizationService.updateLanguage(id, body);
  }

  @Delete('languages/:id')
  @ApiOperation({ summary: 'Delete a language' })
  deleteLanguage(@Param('id') id: string) {
    return this.localizationService.deleteLanguage(id);
  }

  @Patch('languages/:id/set-default')
  @ApiOperation({ summary: 'Set default language' })
  setDefaultLanguage(@Param('id') id: string) {
    return this.localizationService.setDefaultLanguage(id);
  }
}
