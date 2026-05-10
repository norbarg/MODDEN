// src/shared/api/apiClient.ts
import { authStorage } from '../auth/authStorage';
import type { LoginResponse } from '../types/auth';

const API_URL = '/api';

type ApiErrorResponse = {
    message?: string | string[];
    error?: string;
    statusCode?: number;
};

type RequestOptions = Omit<RequestInit, 'headers'> & {
    auth?: boolean;
    retryOnUnauthorized?: boolean;
    headers?: Record<string, string>;
};

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

let refreshTokenPromise: Promise<boolean> | null = null;

function getErrorMessage(errorData: ApiErrorResponse | null) {
    if (Array.isArray(errorData?.message)) {
        return errorData.message.join(', ');
    }

    return errorData?.message || errorData?.error || 'Something went wrong';
}

async function parseResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) {
        return undefined as T;
    }

    const data = (await response.json().catch(() => null)) as
        | ApiErrorResponse
        | T
        | null;

    if (!response.ok) {
        throw new ApiError(
            getErrorMessage(data as ApiErrorResponse | null),
            response.status,
        );
    }

    return data as T;
}

async function executeRefreshAccessToken() {
    const refreshToken = authStorage.getRefreshToken();

    if (!refreshToken) {
        authStorage.clear();
        return false;
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
        authStorage.clear();
        return false;
    }

    const data = (await response.json()) as LoginResponse;

    authStorage.setAccessToken(data.accessToken);
    authStorage.setRefreshToken(data.refreshToken);

    if (data.user) {
        authStorage.setUser(data.user);
    }

    return true;
}

async function refreshAccessToken() {
    if (!refreshTokenPromise) {
        refreshTokenPromise = executeRefreshAccessToken().finally(() => {
            refreshTokenPromise = null;
        });
    }

    return refreshTokenPromise;
}

export async function apiRequest<T>(
    url: string,
    options: RequestOptions = {},
): Promise<T> {
    const {
        auth = false,
        retryOnUnauthorized = true,
        headers,
        ...requestOptions
    } = options;

    const accessToken = authStorage.getAccessToken();

    const response = await fetch(`${API_URL}${url}`, {
        ...requestOptions,
        headers: {
            'Content-Type': 'application/json',
            ...(auth && accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            ...headers,
        },
    });

    if (response.status === 401 && auth && retryOnUnauthorized) {
        const isRefreshed = await refreshAccessToken();

        if (isRefreshed) {
            return apiRequest<T>(url, {
                ...options,
                retryOnUnauthorized: false,
            });
        }

        throw new ApiError('Unauthorized', 401);
    }

    return parseResponse<T>(response);
}
