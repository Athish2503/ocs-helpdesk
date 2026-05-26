import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';
import { FileUpload } from '../../generated/prisma';
import { randomUUID } from 'crypto';

@Injectable()
export class FilesService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private prisma: PrismaService) {
    const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
    const accessKeyId = process.env.MINIO_ACCESS_KEY || 'minioadmin';
    const secretAccessKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
    this.bucketName = process.env.MINIO_BUCKET_NAME || 'helpdesk-attachments';

    this.s3Client = new S3Client({
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region: process.env.MINIO_REGION || 'us-east-1',
      forcePathStyle: true, // Required for MinIO
    });
  }

  async uploadFile(uploaderId: string, file: Express.Multer.File): Promise<FileUpload> {
    const fileId = randomUUID();
    const fileExtension = file.originalname.split('.').pop();
    const minioKey = `attachments/${fileId}.${fileExtension}`;

    try {
      // Upload to MinIO/S3
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: minioKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      // Save to database
      return await this.prisma.fileUpload.create({
        data: {
          id: fileId,
          uploaderId,
          minioKey,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
      });
    } catch (error) {
      console.error('[FILES] Failed to upload file to S3/MinIO:', error);
      throw new InternalServerErrorException('Failed to upload file attachment');
    }
  }

  async getPresignedDownloadUrl(fileId: string): Promise<{ filename: string; url: string }> {
    const fileUpload = await this.prisma.fileUpload.findUnique({
      where: { id: fileId },
    });

    if (!fileUpload) {
      throw new NotFoundException('File attachment not found');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileUpload.minioKey,
      });

      // Expire in 24 hours (86400 seconds) as required by FR-FILE-04
      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 86400 });

      return {
        filename: fileUpload.filename,
        url,
      };
    } catch (error) {
      console.error('[FILES] Failed to generate presigned GET URL:', error);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }
}
