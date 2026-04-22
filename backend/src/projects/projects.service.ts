import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    if (dto.templateId) {
      const template = await this.prisma.template.findUnique({
        where: { id: dto.templateId },
      });

      if (!template) {
        throw new NotFoundException('Template not found');
      }
    }

    return this.prisma.project.create({
      data: {
        userId,
        ...(dto.templateId ? { templateId: dto.templateId } : {}),
        title: dto.title,
        canvasWidth: dto.canvasWidth,
        canvasHeight: dto.canvasHeight,
        sceneJson: dto.sceneJson as Prisma.InputJsonValue,
        thumbnailUrl: dto.thumbnailUrl,
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
    await this.findOneByUser(userId, projectId);

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
}
