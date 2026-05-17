import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BookSubmissionsService } from './book-submissions.service';
import { SubmitBookDto } from './dto/submit-book.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';

@ApiTags('Book Submissions')
@ApiBearerAuth()
@Controller('book-submissions')
@UseGuards(JwtAuthGuard)
export class BookSubmissionsController {
  constructor(private readonly bookSubmissionsService: BookSubmissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a book for publishing consideration' })
  submit(@CurrentUser('id') userId: string, @Body() dto: SubmitBookDto) {
    return this.bookSubmissionsService.submit(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my book submissions' })
  findMine(@CurrentUser('id') userId: string) {
    return this.bookSubmissionsService.findMySubmissions(userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin: list all book submissions' })
  findAll() {
    return this.bookSubmissionsService.findAll();
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Admin: update a book submission status' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSubmissionDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.bookSubmissionsService.update(id, dto, adminId);
  }
}
