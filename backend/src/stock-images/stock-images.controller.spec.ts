import { Test, TestingModule } from '@nestjs/testing';
import { StockImagesController } from './stock-images.controller';

describe('StockImagesController', () => {
  let controller: StockImagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockImagesController],
    }).compile();

    controller = module.get<StockImagesController>(StockImagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
