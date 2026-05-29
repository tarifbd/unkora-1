import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested, MaxLength, Min, Max, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { AiStudioService } from './ai-studio.service';

class ChatDto {
  @IsString()
  @MaxLength(500)
  query: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  context?: string;
}

class ReviewItemDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MaxLength(1000)
  comment: string;
}

class SummarizeReviewsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMaxSize(50)
  @Type(() => ReviewItemDto)
  reviews: ReviewItemDto[];
}

@ApiTags('ai')
@Controller('ai')
export class AiPublicController {
  constructor(private readonly svc: AiStudioService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: 10000 }, medium: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Chat with AI customer support' })
  async chat(@Body() dto: ChatDto) {
    const reply = await this.svc.chatWithCustomer(dto.query, dto.context);
    return { success: true, data: { reply } };
  }

  @Post('reviews/summary')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 10000 }, medium: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Get AI-generated summary of product reviews' })
  async summarizeReviews(@Body() dto: SummarizeReviewsDto) {
    const summary = await this.svc.summarizeProductReviews(dto.reviews);
    return { success: true, data: { summary } };
  }
}
