import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RagService } from './rag.service';

@ApiTags('rag')
@Controller('rag')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class RagController {
  constructor(private readonly svc: RagService) {}

  @Get('admin/documents')
  @ApiOperation({ summary: '[Admin] List knowledge base documents' })
  list(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.listDocuments({ page: +page, limit: +limit, category, status });
  }

  @Post('admin/documents')
  @ApiOperation({ summary: '[Admin] Create knowledge base document' })
  create(
    @Body() dto: { title: string; content: string; category?: string; source?: string },
  ) {
    return this.svc.createDocument(dto);
  }

  @Get('admin/documents/stats')
  @ApiOperation({ summary: '[Admin] Knowledge base stats' })
  stats() {
    return this.svc.getStats();
  }

  @Get('admin/documents/search')
  @ApiOperation({ summary: '[Admin] Search documents' })
  search(@Query('q') q: string) {
    return this.svc.searchDocuments(q ?? '');
  }

  @Get('admin/documents/:id')
  @ApiOperation({ summary: '[Admin] Get document detail' })
  getOne(@Param('id') id: string) {
    return this.svc.getDocument(id);
  }

  @Patch('admin/documents/:id')
  @ApiOperation({ summary: '[Admin] Update document' })
  update(
    @Param('id') id: string,
    @Body() dto: { title?: string; content?: string; category?: string; isActive?: boolean },
  ) {
    return this.svc.updateDocument(id, dto);
  }

  @Delete('admin/documents/:id')
  @ApiOperation({ summary: '[Admin] Delete document' })
  remove(@Param('id') id: string) {
    return this.svc.deleteDocument(id);
  }
}
