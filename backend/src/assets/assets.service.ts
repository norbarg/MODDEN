// src/assets/assets.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

type CreateAssetParams = {
  userId: string;
  fileUrl: string;
};

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create({ userId, fileUrl }: CreateAssetParams) {
    return this.prisma.asset.create({
      data: {
        userId,
        fileUrl,
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.asset.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async remove(userId: string, assetId: string) {
    const asset = await this.prisma.asset.findUnique({
      where: {
        id: assetId,
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.userId !== userId) {
      throw new ForbiddenException('You do not have access to this asset');
    }

    const fileName = asset.fileUrl.split('/uploads/assets/')[1];

    if (fileName) {
      const filePath = join(process.cwd(), 'uploads', 'assets', fileName);

      try {
        await unlink(filePath);
      } catch {
      }
    }

    await this.prisma.asset.delete({
      where: {
        id: assetId,
      },
    });

    return {
      message: 'Asset deleted successfully',
    };
  }
}
