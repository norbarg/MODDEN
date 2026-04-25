import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, fileUrl: string) {
    return this.prisma.asset.create({
      data: {
        userId,
        fileUrl,
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.asset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, assetId: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.userId !== userId) {
      throw new ForbiddenException('You do not have access to this asset');
    }

    const fileName = asset.fileUrl.split('/uploads/')[1];

    if (fileName) {
      const filePath = join(process.cwd(), 'uploads', fileName);

      try {
        await unlink(filePath);
      } catch {
        // ignore if file is already missing
      }
    }

    await this.prisma.asset.delete({
      where: { id: assetId },
    });

    return {
      message: 'Asset deleted successfully',
    };
  }
}
