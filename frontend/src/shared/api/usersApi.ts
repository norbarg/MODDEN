// src/shared/api/usersApi.ts
import { apiRequest } from './apiClient';
import type { AuthUser } from '../types/auth';

export const usersApi = {
  getMe() {
    return apiRequest<AuthUser>('/users/me', {
      method: 'GET',
      auth: true,
    });
  },
};
