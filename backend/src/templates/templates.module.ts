import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, OptionalJwtAuthGuard],
})
export class TemplatesModule {}
