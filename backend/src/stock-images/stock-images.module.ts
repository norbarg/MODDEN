import { Module } from '@nestjs/common';
import { StockImagesController } from './stock-images.controller';
import { StockImagesService } from './stock-images.service';

@Module({
  controllers: [StockImagesController],
  providers: [StockImagesService],
})
export class StockImagesModule {}
