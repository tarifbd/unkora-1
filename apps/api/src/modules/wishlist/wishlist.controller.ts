import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ToggleWishlistDto } from './dto/toggle-wishlist.dto';
import { WishlistService } from './wishlist.service';

@ApiTags('wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get my wishlist with product details' })
  getWishlist(@CurrentUser('id') userId: string) {
    return this.wishlistService.getWishlist(userId);
  }

  @Post('toggle')
  @ApiOperation({ summary: 'Add or remove a product from wishlist' })
  toggle(@CurrentUser('id') userId: string, @Body() dto: ToggleWishlistDto) {
    return this.wishlistService.toggle(userId, dto.productId);
  }

  @Get('check/:productId')
  @ApiOperation({ summary: 'Check if a product is wishlisted' })
  check(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlistService.isWishlisted(userId, productId);
  }
}
