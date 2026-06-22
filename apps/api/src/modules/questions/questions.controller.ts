import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post('product/:productId')
  @ApiOperation({ summary: 'Submit a question for a product' })
  create(
    @Param('productId') productId: string,
    @Body() dto: CreateQuestionDto,
    @Query('userId') userId?: string,
  ) {
    return this.questionsService.create(productId, dto, userId);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get approved Q&A for a product' })
  findByProduct(
    @Param('productId') productId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.questionsService.findByProduct(productId, page ? +page : 1, limit ? +limit : 10);
  }

  // ── Admin ──────────────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all questions' })
  adminGetAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.questionsService.adminGetAll(page ? +page : 1, limit ? +limit : 20, status);
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: approve or reject a question' })
  updateStatus(@Param('id') id: string, @Body() dto: { status: 'APPROVED' | 'REJECTED' }) {
    return this.questionsService.adminUpdateStatus(id, dto.status);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: delete a question' })
  adminDelete(@Param('id') id: string) {
    return this.questionsService.adminDelete(id);
  }

  @Post('admin/:questionId/answers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: post an answer' })
  addAdminAnswer(
    @Param('questionId') questionId: string,
    @Body() dto: CreateAnswerDto,
    @CurrentUser() user: User,
  ) {
    return this.questionsService.addAnswer(questionId, dto, user.id, true);
  }

  @Delete('admin/answers/:answerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: delete an answer' })
  deleteAnswer(@Param('answerId') answerId: string, @CurrentUser() user: User) {
    return this.questionsService.deleteAnswer(answerId, user.id, true);
  }
}
