import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
      },
    });
  }

  async createRefreshToken(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }) {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  async findRefreshToken(token: string) {
    return this.prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  async deleteRefreshToken(token: string) {
    return this.prisma.refreshToken.delete({
      where: { token },
    });
  }

  async deleteUserRefreshTokens(userId: string) {
    return this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async createEmailVerificationToken(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }) {
    return this.prisma.emailVerificationToken.create({
      data,
    });
  }

  async findEmailVerificationToken(token: string) {
    return this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteEmailVerificationToken(token: string) {
    return this.prisma.emailVerificationToken.delete({
      where: { token },
    });
  }

  async deleteUserEmailVerificationTokens(userId: string) {
    return this.prisma.emailVerificationToken.deleteMany({
      where: { userId },
    });
  }

  async markEmailAsVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
  }
}
