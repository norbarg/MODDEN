import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsUrl,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'new_username',
    description: 'Updated username',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.png',
    description: 'User avatar URL',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  avatarUrl?: string;
}
