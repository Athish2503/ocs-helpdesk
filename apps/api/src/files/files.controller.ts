import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { FilesService } from './files.service';

@Controller('files')
@UseGuards(AuthGuard('jwt'))
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const fileUpload = await this.filesService.uploadFile(req.user.id, file);
    return {
      message: 'File uploaded successfully',
      fileId: fileUpload.id,
      filename: fileUpload.filename,
      mimeType: fileUpload.mimeType,
      size: fileUpload.size,
    };
  }

  @Get(':id/url')
  async getDownloadUrl(@Param('id') id: string) {
    return this.filesService.getPresignedDownloadUrl(id);
  }

  @Get(':id')
  async redirectToDownload(@Param('id') id: string, @Res() res: Response) {
    const { url } = await this.filesService.getPresignedDownloadUrl(id);
    return res.redirect(url);
  }
}
