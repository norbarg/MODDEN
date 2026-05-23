//src/templates/templates.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TemplateCategory } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplatesService } from './templates.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @ApiQuery({
    name: 'category',
    required: false,
    enum: TemplateCategory,
  })
  @Get('system')
  findSystemTemplates(@Query('category') category?: TemplateCategory) {
    return this.templatesService.findSystemTemplates(category);
  }

  @ApiQuery({
    name: 'category',
    required: false,
    enum: TemplateCategory,
  })
  @Get('public')
  findPublicTemplates(@Query('category') category?: TemplateCategory) {
    return this.templatesService.findPublicTemplates(category);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    name: 'category',
    required: false,
    enum: TemplateCategory,
  })
  @Get('me')
  findMyTemplates(
    @CurrentUser() user: { userId: string; email: string; username: string },
    @Query('category') category?: TemplateCategory,
  ) {
    return this.templatesService.findMyTemplates(user.userId, category);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: { userId: string; email: string; username: string },
    @Body() dto: CreateTemplateDto,
  ) {
    return this.templatesService.create(user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser()
    user: { userId: string; email: string; username: string } | null,
  ) {
    return this.templatesService.findOneAccessible(user?.userId ?? null, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string; email: string; username: string },
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(user.userId, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @CurrentUser() user: { userId: string; email: string; username: string },
    @Param('id') id: string,
  ) {
    return this.templatesService.remove(user.userId, id);
  }
}
