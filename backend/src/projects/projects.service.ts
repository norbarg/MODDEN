import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TemplateCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    const template = await this.prisma.template.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const isOwner = template.ownerUserId === userId;

    if (!template.isSystem && !template.isPublic && !isOwner) {
      throw new ForbiddenException('You do not have access to this template');
    }

    const canvasWidth = dto.canvasWidth ?? template.canvasWidth;
    const canvasHeight = dto.canvasHeight ?? template.canvasHeight;

    const category =
      dto.canvasWidth !== undefined || dto.canvasHeight !== undefined
        ? this.resolveCategoryByCanvasSize(canvasWidth, canvasHeight)
        : template.category;

    return this.prisma.project.create({
      data: {
        userId,
        templateId: template.id,
        title: dto.title ?? template.title,
        category,
        canvasWidth,
        canvasHeight,
        sceneJson:
          (dto.sceneJson as Prisma.InputJsonValue | undefined) ??
          (template.sceneJson as Prisma.InputJsonValue),
        thumbnailUrl: dto.thumbnailUrl ?? template.thumbnailUrl,
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOneByUser(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    const project = await this.findOneByUser(userId, projectId);

    const nextCanvasWidth = dto.canvasWidth ?? project.canvasWidth;
    const nextCanvasHeight = dto.canvasHeight ?? project.canvasHeight;

    const nextCategory = this.resolveCategoryByCanvasSize(
      nextCanvasWidth,
      nextCanvasHeight,
    );

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
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
        category: nextCategory,
      },
    });
  }

  async remove(userId: string, projectId: string) {
    await this.findOneByUser(userId, projectId);

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    return {
      message: 'Project deleted successfully',
    };
  }

  private resolveCategoryByCanvasSize(
    width: number,
    height: number,
  ): TemplateCategory {
    const presets: Record<
      Exclude<TemplateCategory, 'CUSTOM_SIZE'>,
      { width: number; height: number }
    > = {
      INFOGRAPHICS: { width: 800, height: 2000 },
      POSTERS: { width: 1080, height: 1350 },
      BANNERS: { width: 1200, height: 628 },
      BOOK_COVERS: { width: 1600, height: 2560 },
      LOGOS: { width: 500, height: 500 },
      MENUS: { width: 1080, height: 1920 },
      SOCIAL_MEDIA: { width: 1080, height: 1080 },
      WALLPAPERS: { width: 1920, height: 1080 },
    };

    for (const [category, size] of Object.entries(presets)) {
      if (size.width === width && size.height === height) {
        return category as TemplateCategory;
      }
    }

    return TemplateCategory.CUSTOM_SIZE;
  }
}
