import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { MultipartFile } from '@fastify/multipart';
import type { FastifyRequest } from 'fastify';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DeleteImageDto } from './dto/delete-image.dto';
import { UploadService } from './upload.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface MultipartRequest extends FastifyRequest {
  isMultipart: () => boolean;
  file: (opts?: { limits?: { fileSize?: number } }) => Promise<MultipartFile | undefined>;
}

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: 'Admin: upload a single image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async uploadImage(@Req() req: MultipartRequest) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data');
    }

    const data = await req.file({ limits: { fileSize: MAX_FILE_SIZE } });
    if (!data) throw new BadRequestException('No file provided');

    const ext = path.extname(data.filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(data.mimetype)) {
      data.file.resume();
      throw new BadRequestException('Only image files (jpg, png, webp, gif) are allowed');
    }

    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);

    await pipeline(data.file, fs.createWriteStream(filePath));

    return this.uploadService.uploadImage(filename);
  }

  @Delete('image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: delete an uploaded image by URL' })
  deleteImage(@Body() dto: DeleteImageDto) {
    return this.uploadService.deleteImage(dto.url);
  }
}
