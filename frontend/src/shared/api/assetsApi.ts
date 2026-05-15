// src/shared/api/assetsApi.ts
import { authStorage } from '../auth/authStorage';

const API_URL = '/api';

export type UploadedAsset = {
    id: string;
    userId: string;
    fileUrl: string;
    createdAt: string;
};

type UploadAssetResponse = {
    message: string;
    asset: UploadedAsset;
};

async function parseResponse<T>(response: Response): Promise<T> {
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            data?.message || data?.error || 'Something went wrong';

        throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }

    return data as T;
}

function getAuthHeaders() {
    const accessToken = authStorage.getAccessToken();

    return accessToken
        ? {
              Authorization: `Bearer ${accessToken}`,
          }
        : {};
}

export const assetsApi = {
    async getMyAssets() {
        const response = await fetch(`${API_URL}/assets/me`, {
            method: 'GET',
            headers: {
                ...getAuthHeaders(),
            },
        });

        return parseResponse<UploadedAsset[]>(response);
    },

    async uploadAsset(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/assets/upload`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
            },
            body: formData,
        });

        return parseResponse<UploadAssetResponse>(response);
    },

    async deleteAsset(assetId: string) {
        const response = await fetch(`${API_URL}/assets/${assetId}`, {
            method: 'DELETE',
            headers: {
                ...getAuthHeaders(),
            },
        });

        return parseResponse<{ message: string }>(response);
    },
};
