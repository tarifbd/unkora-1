import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateReviewBodyDto } from './dto/create-review-body.dto';
import { PublishReviewDto } from './dto/publish-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a product' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReviewBodyDto) {
    const { productId, ...reviewDto } = dto;
    return this.reviewsService.create(userId, productId, reviewDto);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all reviews' })
  adminGetAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.reviewsService.adminGetAll(parseInt(page, 10), parseInt(limit, 10));
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get published reviews for a product' })
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Get('my/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my review for a product" })
  findMyReview(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.reviewsService.findMyReview(userId, productId);
  }

  @Patch('admin/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: publish or unpublish a review' })
  adminPublish(@Param('id') id: string, @Body() dto: PublishReviewDto) {
    return this.reviewsService.adminPublish(id, dto.isPublished);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my review' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete my review' })
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.reviewsService.delete(userId, id);
  }
}
