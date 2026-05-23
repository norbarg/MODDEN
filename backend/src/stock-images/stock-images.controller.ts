//src/stock-images/stock-images.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchStockImagesDto } from './dto/search-stock-images.dto';
import { StockImagesService } from './stock-images.service';

@ApiTags('Stock Images')
@Controller('stock-images')
export class StockImagesController {
  constructor(private readonly stockImagesService: StockImagesService) {}

  @Get('search')
  search(@Query() dto: SearchStockImagesDto) {
    return this.stockImagesService.search(dto);
  }

  @Get('curated')
  curated(@Query() dto: SearchStockImagesDto) {
    return this.stockImagesService.curated(dto);
  }
}
