//src/stock-images/stock-images.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { SearchStockImagesDto } from './dto/search-stock-images.dto';

type PexelsPhotoSrc = {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
};

type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  avg_color: string | null;
  alt: string | null;
  src: PexelsPhotoSrc;
};

type PexelsSearchResponse = {
  page: number;
  per_page: number;
  total_results: number;
  next_page?: string;
  prev_page?: string;
  photos: PexelsPhoto[];
};

@Injectable()
export class StockImagesService {
  private readonly baseUrl = 'https://api.pexels.com/v1';

  private getHeaders() {
    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException(
        'PEXELS_API_KEY is not configured',
      );
    }

    return {
      Authorization: apiKey,
    };
  }

  private normalizeResponse(data: PexelsSearchResponse) {
    return {
      page: data.page,
      perPage: data.per_page,
      totalResults: data.total_results,
      hasNextPage: !!data.next_page,
      hasPrevPage: !!data.prev_page,
      items: data.photos.map((photo) => ({
        id: photo.id,
        width: photo.width,
        height: photo.height,
        alt: photo.alt,
        avgColor: photo.avg_color,
        pexelsUrl: photo.url,
        photographer: {
          name: photo.photographer,
          url: photo.photographer_url,
        },
        imageUrl: photo.src.large,
        previewUrl: photo.src.medium,
        thumbnailUrl: photo.src.small,
        originalUrl: photo.src.original,
        portraitUrl: photo.src.portrait,
        landscapeUrl: photo.src.landscape,
      })),
      attribution: {
        provider: 'Pexels',
        providerUrl: 'https://www.pexels.com',
        note: 'Show a link to Pexels and credit photographers when possible.',
      },
    };
  }

  async search(dto: SearchStockImagesDto) {
    if (!dto.query || !dto.query.trim()) {
      throw new BadRequestException('Query is required');
    }

    try {
      const response = await axios.get<PexelsSearchResponse>(
        `${this.baseUrl}/search`,
        {
          headers: this.getHeaders(),
          params: {
            query: dto.query.trim(),
            page: dto.page ?? 1,
            per_page: dto.perPage ?? 15,
          },
        },
      );

      return this.normalizeResponse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Pexels search error:',
          error.response?.data || error.message,
        );

        throw new InternalServerErrorException(
          error.response?.data || 'Failed to fetch stock images',
        );
      }

      throw new InternalServerErrorException('Failed to fetch stock images');
    }
  }
  async curated(dto: SearchStockImagesDto) {
    try {
      const response = await axios.get<PexelsSearchResponse>(
        `${this.baseUrl}/curated`,
        {
          headers: this.getHeaders(),
          params: {
            page: dto.page ?? 1,
            per_page: dto.perPage ?? 15,
          },
        },
      );

      return this.normalizeResponse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Pexels curated error:',
          error.response?.data || error.message,
        );

        throw new InternalServerErrorException(
          error.response?.data || 'Failed to fetch curated stock images',
        );
      }

      throw new InternalServerErrorException(
        'Failed to fetch curated stock images',
      );
    }
  }
}
