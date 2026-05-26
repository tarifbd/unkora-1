import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GiftCardStatus } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateGiftCardDto } from './dto/create-gift-card.dto';
import { UpdateGiftCardDto } from './dto/update-gift-card.dto';
import { ValidateGiftCardDto } from './dto/validate-gift-card.dto';
import { GiftCardsService } from './gift-cards.service';

@ApiTags('gift-cards')
@Controller('gift-cards')
export class GiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all gift cards' })
  adminFindAll(@Query('status') status?: GiftCardStatus) {
    return this.giftCardsService.adminFindAll(status);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: gift card stats' })
  adminStats() {
    return this.giftCardsService.adminStats();
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: create a gift card' })
  adminCreate(@Body() dto: CreateGiftCardDto) {
    return this.giftCardsService.adminCreate(dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: update gift card status or note' })
  adminUpdate(@Param('id') id: string, @Body() dto: UpdateGiftCardDto) {
    return this.giftCardsService.adminUpdate(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: delete a gift card' })
  adminDelete(@Param('id') id: string) {
    return this.giftCardsService.adminDelete(id);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate a gift card code and return balance' })
  validate(@Body() dto: ValidateGiftCardDto) {
    return this.giftCardsService.validate(dto.code);
  }
}
