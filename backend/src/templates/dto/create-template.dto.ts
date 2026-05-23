import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { TemplateCategory } from '@prisma/client';

export class CreateTemplateDto {
  @ApiProperty({
    example: 'My poster base',
    description: 'Template title',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    enum: TemplateCategory,
    example: TemplateCategory.POSTERS,
    description: 'Template category',
  })
  @IsEnum(TemplateCategory)
  category!: TemplateCategory;

  @ApiProperty({
    example: 1080,
    description: 'Canvas width',
  })
  @IsInt()
  @Min(1)
  canvasWidth!: number;

  @ApiProperty({
    example: 1350,
    description: 'Canvas height',
  })
  @IsInt()
  @Min(1)
  canvasHeight!: number;

  @ApiProperty({
    example: {
      background: '#ffffff',
      elements: [],
    },
    description: 'Serialized template scene JSON',
  })
  @IsObject()
  sceneJson!: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'https://example.com/template-thumb.png',
    description: 'Template preview image URL',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({
    example: false,
    description: 'Whether the template is public',
  })
  @IsBoolean()
  isPublic!: boolean;

  @ApiPropertyOptional({
    example: '1c2d3e4f-1234-5678-9abc-123456789abc',
    description: 'Source project ID if template was created from a project',
  })
  @IsOptional()
  @IsUUID()
  sourceProjectId?: string;
}
