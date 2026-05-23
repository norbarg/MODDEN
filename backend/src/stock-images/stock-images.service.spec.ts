import { Test, TestingModule } from '@nestjs/testing';
import { StockImagesService } from './stock-images.service';

describe('StockImagesService', () => {
  let service: StockImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockImagesService],
    }).compile();

    service = module.get<StockImagesService>(StockImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
