import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    example: 'My first poster',
    description: 'Project title',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    example: '',
    description: 'Source template ID',
  })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({
    example: 1080,
    description: 'Canvas width',
  })
  @IsInt()
  @Min(1)
  canvasWidth!: number;

  @ApiProperty({
    example: 1080,
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
    description: 'Serialized editor scene JSON',
  })
  @IsObject()
  sceneJson!: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'https://example.com/project-thumb.png',
    description: 'Project preview image URL',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}
