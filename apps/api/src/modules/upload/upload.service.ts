import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private s3: S3Client | null = null;
  private bucket: string | null = null;
  private publicUrl: string | null = null;
  private useR2: boolean = false;

  constructor(private config: ConfigService) {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = this.config.get<string>('R2_BUCKET_NAME') ?? null;
    this.publicUrl = this.config.get<string>('R2_PUBLIC_URL') ?? null;

    if (accountId && accessKeyId && secretAccessKey && this.bucket) {
      this.s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.useR2 = true;
      this.logger.log('R2 storage enabled');
    } else {
      this.logger.log('R2 not configured — using local storage');
    }
  }

  async uploadImageBuffer(buffer: Buffer, filename: string, mimeType: string): Promise<{ url: string }> {
    if (this.useR2 && this.s3 && this.bucket) {
      const key = `uploads/${filename}`;
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000',
      }));
      const base = this.publicUrl?.replace(/\/$/, '') ?? `https://${this.bucket}.r2.dev`;
      return { url: `${base}/${key}` };
    }

    // Local fallback
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    return { url: `/uploads/${filename}` };
  }

  async deleteImage(url: string): Promise<{ message: string }> {
    if (!url) throw new BadRequestException('Invalid URL');

    if (this.useR2 && this.s3 && this.bucket && !url.startsWith('/uploads/')) {
      const base = this.publicUrl?.replace(/\/$/, '') ?? '';
      const key = base ? url.replace(`${base}/`, '') : url.split('.r2.dev/')[1];
      if (key) {
        await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
        return { message: 'File deleted from R2' };
      }
    }

    // Local fallback
    if (url.startsWith('/uploads/')) {
      const filename = path.basename(url);
      const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return { message: 'File deleted' };
    }

    throw new BadRequestException('Cannot delete this file');
  }
}
