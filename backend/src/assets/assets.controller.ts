// src/assets/assets.controller.ts
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssetsService } from './assets.service';

const ASSETS_UPLOAD_DIR = join(process.cwd(), 'uploads', 'assets');

function ensureAssetsUploadDir() {
  mkdirSync(ASSETS_UPLOAD_DIR, { recursive: true });
}

function generateFileName(originalName: string): string {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const extension = extname(originalName).toLowerCase();

  return `asset-${uniqueSuffix}${extension}`;
}

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          ensureAssetsUploadDir();
          callback(null, ASSETS_UPLOAD_DIR);
        },
        filename: (_req, file, callback) => {
          callback(null, generateFileName(file.originalname));
        },
      }),
      fileFilter: (_req, file, callback) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Only JPG, JPEG, PNG, and WEBP images are allowed',
            ),
            false,
          );
        }

        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async upload(
    @CurrentUser() user: { userId: string; email: string; username: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const fileUrl = `${backendUrl}/uploads/assets/${file.filename}`;

    const asset = await this.assetsService.create({
      userId: user.userId,
      fileUrl,
    });

    return {
      message: 'Asset uploaded successfully',
      asset,
    };
  }

  @Get('me')
  findMyAssets(
    @CurrentUser() user: { userId: string; email: string; username: string },
  ) {
    return this.assetsService.findAllByUser(user.userId);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { userId: string; email: string; username: string },
    @Param('id') id: string,
  ) {
    return this.assetsService.remove(user.userId, id);
  }
}
