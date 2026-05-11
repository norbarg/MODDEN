// src/shared/api/usersApi.ts
import { apiRequest } from './apiClient';
import type { AuthUser } from '../types/auth';

type UpdateProfileRequest = {
    username?: string;
    avatarUrl?: string | null;
};

export const usersApi = {
    getMe() {
        return apiRequest<AuthUser>('/users/me', {
            method: 'GET',
            auth: true,
        });
    },

    updateMe(dto: UpdateProfileRequest) {
        return apiRequest<AuthUser>('/users/me', {
            method: 'PATCH',
            auth: true,
            body: JSON.stringify(dto),
        });
    },

    deleteMe() {
        return apiRequest<{ message: string }>('/users/me', {
            method: 'DELETE',
            auth: true,
        });
    },
};
