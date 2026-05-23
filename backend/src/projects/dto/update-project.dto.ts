import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    example: 'Updated poster name',
    description: 'Project title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 1200,
    description: 'Canvas width',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  canvasWidth?: number;

  @ApiPropertyOptional({
    example: 628,
    description: 'Canvas height',
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
    description: 'Serialized editor scene JSON',
  })
  @IsOptional()
  @IsObject()
  sceneJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'https://example.com/new-thumb.png',
    description: 'Project preview image URL',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}
