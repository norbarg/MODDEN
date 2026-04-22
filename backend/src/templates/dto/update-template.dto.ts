import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TemplateCategory } from '@prisma/client';

export class UpdateTemplateDto {
  @ApiPropertyOptional({
    example: 'Updated template title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    enum: TemplateCategory,
    example: TemplateCategory.SOCIAL_MEDIA,
  })
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @ApiPropertyOptional({
    example: 1200,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  canvasWidth?: number;

  @ApiPropertyOptional({
    example: 628,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  canvasHeight?: number;

  @ApiPropertyOptional({
    example: {
      background: '#000000',
      elements: [],
    },
  })
  @IsOptional()
  @IsObject()
  sceneJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'https://example.com/new-thumb.png',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
