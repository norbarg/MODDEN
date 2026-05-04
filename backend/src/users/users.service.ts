import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

  async findPublicById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
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

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.username) {
      const existingUser = await this.findByUsername(dto.username);

      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Username is already in use');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.username !== undefined ? { username: dto.username } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
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

  async findByEmailOrUsername(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
  }

  async deleteMyAccount(userId: string) {
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      message: 'Account deleted successfully',
    };
  }
  async findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async createGoogleUser(data: {
    email: string;
    username: string;
    googleId: string;
    avatarUrl?: string | null;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        googleId: data.googleId,
        avatarUrl: data.avatarUrl,
        authProvider: 'GOOGLE',
        isEmailVerified: true,
      },
    });
  }

  async linkGoogleToExistingUser(data: {
    userId: string;
    googleId: string;
    avatarUrl?: string | null;
  }) {
    return this.prisma.user.update({
      where: { id: data.userId },
      data: {
        googleId: data.googleId,
        avatarUrl: data.avatarUrl,
        isEmailVerified: true,
      },
    });
  }
}
