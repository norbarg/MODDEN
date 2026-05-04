// src/shared/api/authApi.ts
import { apiRequest } from './apiClient';
import { authStorage } from '../auth/authStorage';
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
} from '../types/auth';

export const authApi = {
    register(dto: RegisterRequest) {
        return apiRequest<RegisterResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(dto),
        });
    },

    login(dto: LoginRequest) {
        return apiRequest<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(dto),
        });
    },

    googleLogin(credential: string) {
        return apiRequest<LoginResponse>('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential }),
        });
    },

    verifyEmail(token: string) {
        return apiRequest<{ message: string }>('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    },

    async logout() {
        const refreshToken = authStorage.getRefreshToken();

        if (refreshToken) {
            await apiRequest<{ message: string }>('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken }),
            }).catch(() => null);
        }

        authStorage.clear();
    },
};
