import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TemplateCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTemplateDto) {
    return this.prisma.template.create({
      data: {
        ownerUserId: userId,
        sourceProjectId: dto.sourceProjectId,
        title: dto.title,
        category: dto.category,
        canvasWidth: dto.canvasWidth,
        canvasHeight: dto.canvasHeight,
        sceneJson: dto.sceneJson as Prisma.InputJsonValue,
        thumbnailUrl: dto.thumbnailUrl,
        isPublic: dto.isPublic,
        isSystem: false,
      },
    });
  }

  async findSystemTemplates(category?: TemplateCategory) {
    return this.prisma.template.findMany({
      where: {
        isSystem: true,
        ...(category ? { category } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findPublicTemplates(category?: TemplateCategory) {
    return this.prisma.template.findMany({
      where: {
        isSystem: false,
        isPublic: true,
        ...(category ? { category } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findMyTemplates(userId: string, category?: TemplateCategory) {
    return this.prisma.template.findMany({
      where: {
        ownerUserId: userId,
        isSystem: false,
        ...(category ? { category } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOneAccessible(userId: string | null, templateId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const isOwner = userId && template.ownerUserId === userId;

    if (!template.isSystem && !template.isPublic && !isOwner) {
      throw new ForbiddenException('You do not have access to this template');
    }

    return template;
  }

  async update(userId: string, templateId: string, dto: UpdateTemplateDto) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.isSystem) {
      throw new ForbiddenException('System templates cannot be updated');
    }

    if (template.ownerUserId !== userId) {
      throw new ForbiddenException('You do not have access to this template');
    }

    return this.prisma.template.update({
      where: { id: templateId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.canvasWidth !== undefined
          ? { canvasWidth: dto.canvasWidth }
          : {}),
        ...(dto.canvasHeight !== undefined
          ? { canvasHeight: dto.canvasHeight }
          : {}),
        ...(dto.sceneJson !== undefined
          ? { sceneJson: dto.sceneJson as Prisma.InputJsonValue }
          : {}),
        ...(dto.thumbnailUrl !== undefined
          ? { thumbnailUrl: dto.thumbnailUrl }
          : {}),
        ...(dto.isPublic !== undefined ? { isPublic: dto.isPublic } : {}),
      },
    });
  }

  async remove(userId: string, templateId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.isSystem) {
      throw new ForbiddenException('System templates cannot be deleted');
    }

    if (template.ownerUserId !== userId) {
      throw new ForbiddenException('You do not have access to this template');
    }

    await this.prisma.template.delete({
      where: { id: templateId },
    });

    return {
      message: 'Template deleted successfully',
    };
  }
}
