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

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ---- Admin routes (must be declared before :slug wildcard) ----

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all posts regardless of status' })
  findAll(
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('tag') tag?: string,
  ) {
    return this.blogService.findAll({
      status,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      tag,
    });
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: create a new blog post' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreatePostDto) {
    return this.blogService.create(user.id, dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: update a blog post' })
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.blogService.update(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: delete a blog post' })
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }

  // ---- Public routes ----

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public: list published blog posts (paginated, optional ?tag= filter)' })
  findPublished(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('tag') tag?: string,
  ) {
    return this.blogService.findPublished({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      tag,
    });
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public: get a single published post by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }
}
