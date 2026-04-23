import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    example: '2e7a2d1f-3b5d-4d67-9c4f-123456789abc',
    description: 'Source template ID',
  })
  @IsUUID()
  templateId!: string;

  @ApiPropertyOptional({
    example: 'My first poster',
    description: 'Project title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 1080,
    description: 'Canvas width override',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  canvasWidth?: number;

  @ApiPropertyOptional({
    example: 1080,
    description: 'Canvas height override',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  canvasHeight?: number;

  @ApiPropertyOptional({
    example: {
      background: '#ffffff',
      elements: [],
    },
    description: 'Optional overridden scene JSON',
  })
  @IsOptional()
  @IsObject()
  sceneJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'https://example.com/project-thumb.png',
    description: 'Project preview image URL',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}
