import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  uploadImage(filename: string): { url: string } {
    if (!filename) throw new BadRequestException('No file provided');
    return { url: `/uploads/${filename}` };
  }

  deleteImage(url: string): { message: string } {
    if (!url || !url.startsWith('/uploads/')) {
      throw new BadRequestException('Invalid file URL');
    }

    const filename = path.basename(url);
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }

    fs.unlinkSync(filePath);
    return { message: 'File deleted' };
  }
}
