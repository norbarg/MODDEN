// src/shared/types/auth.ts

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  isEmailVerified: boolean;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type RegisterRequest = {
  email: string;
  username: string;
  password: string;
};

export type LoginRequest = {
  identifier: string;
  password: string;
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
