import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AiStudioService } from './ai-studio.service';

class ChatDto {
  @IsString()
  query: string;

  @IsString()
  @IsOptional()
  context?: string;
}

class ReviewItemDto {
  @IsNumber()
  rating: number;

  @IsString()
  comment: string;
}

class SummarizeReviewsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewItemDto)
  reviews: ReviewItemDto[];
}

@ApiTags('ai')
@Controller('ai')
export class AiPublicController {
  constructor(private readonly svc: AiStudioService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat with AI customer support' })
  async chat(@Body() dto: ChatDto) {
    const reply = await this.svc.chatWithCustomer(dto.query, dto.context);
    return { success: true, data: { reply } };
  }

  @Post('reviews/summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI-generated summary of product reviews' })
  async summarizeReviews(@Body() dto: SummarizeReviewsDto) {
    const summary = await this.svc.summarizeProductReviews(dto.reviews);
    return { success: true, data: { summary } };
  }
}
