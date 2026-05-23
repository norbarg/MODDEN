import { apiRequest } from './apiClient';

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

export const assetsApi = {
    getMyAssets() {
        return apiRequest<UploadedAsset[]>('/assets/me', {
            method: 'GET',
            auth: true,
        });
    },

    uploadAsset(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        return apiRequest<UploadAssetResponse>('/assets/upload', {
            method: 'POST',
            auth: true,
            body: formData,
        });
    },

    deleteAsset(assetId: string) {
        return apiRequest<{ message: string }>(`/assets/${assetId}`, {
            method: 'DELETE',
            auth: true,
        });
    },
};
