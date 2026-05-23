//src/shared/api/stockImagesApi.ts
import { apiRequest } from './apiClient';

export type StockImage = {
    id: number;
    width: number;
    height: number;
    alt: string | null;
    avgColor: string | null;
    pexelsUrl: string;
    photographer: {
        name: string;
        url: string;
    };
    imageUrl: string;
    previewUrl: string;
    thumbnailUrl: string;
    originalUrl: string;
    portraitUrl: string;
    landscapeUrl: string;
};

export type StockImagesResponse = {
    page: number;
    perPage: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    items: StockImage[];
    attribution: {
        provider: string;
        providerUrl: string;
        note: string;
    };
};

type StockImagesParams = {
    page?: number;
    perPage?: number;
};

type SearchStockImagesParams = StockImagesParams & {
    query: string;
};

function buildQueryParams(params: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === '') {
            return;
        }

        searchParams.set(key, String(value));
    });

    return searchParams.toString();
}

export const stockImagesApi = {
    curated({ page = 1, perPage = 20 }: StockImagesParams = {}) {
        const query = buildQueryParams({
            page,
            perPage,
        });

        return apiRequest<StockImagesResponse>(`/stock-images/curated?${query}`, {
            method: 'GET',
        });
    },

    search({ query, page = 1, perPage = 20 }: SearchStockImagesParams) {
        const search = buildQueryParams({
            query,
            page,
            perPage,
        });

        return apiRequest<StockImagesResponse>(`/stock-images/search?${search}`, {
            method: 'GET',
        });
    },
};
