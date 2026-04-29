//src/shared/api/authApi.ts
const API_URL = '/api';

export type RegisterRequest = {
  email: string;
  username: string;
  password: string;
};

export type LoginRequest = {
  identifier: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  isEmailVerified: boolean;
};

export type RegisterResponse = {
  message: string;
  user: AuthUser;
};

export type LoginResponse = {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

async function request<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = (await response.json().catch(() => null)) as ApiErrorResponse | T | null;

  if (!response.ok) {
    const errorData = data as ApiErrorResponse | null;

    if (Array.isArray(errorData?.message)) {
      throw new Error(errorData.message.join(', '));
    }

    throw new Error(errorData?.message || 'Something went wrong');
  }

  return data as T;
}

export const authApi = {
  register(dto: RegisterRequest) {
    return request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  login(dto: LoginRequest) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  verifyEmail(token: string) {
    return request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
};
