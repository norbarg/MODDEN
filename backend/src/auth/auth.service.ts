//src/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { StringValue } from 'ms';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingByEmail = await this.usersService.findByEmail(dto.email);
    if (existingByEmail) {
      throw new BadRequestException('Email is already in use');
    }

    const existingByUsername = await this.usersService.findByUsername(
      dto.username,
    );
    if (existingByUsername) {
      throw new BadRequestException('Username is already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const expiresHours = Number(
      process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS || 24,
    );

    const verificationExpiresAt = new Date();
    verificationExpiresAt.setHours(
      verificationExpiresAt.getHours() + expiresHours,
    );

    await this.usersService.createEmailVerificationToken({
      userId: user.id,
      token: verificationToken,
      expiresAt: verificationExpiresAt,
    });

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await this.mailService.sendVerificationEmail(user.email, verificationLink);

    return {
      message: 'User registered successfully. Please verify your email.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailOrUsername(dto.identifier);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const accessExpiresIn =
      (process.env.JWT_ACCESS_EXPIRES_IN as StringValue) || '15m';
    const refreshExpiresIn =
      (process.env.JWT_REFRESH_EXPIRES_IN as StringValue) || '30d';

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: accessExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: refreshExpiresIn,
    });

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);

    await this.usersService.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshExpiresAt,
    });

    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async refresh(refreshToken: string) {
    const storedToken = await this.usersService.findRefreshToken(refreshToken);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.usersService.deleteRefreshToken(refreshToken);
      throw new UnauthorizedException('Refresh token expired');
    }

    let payload: { sub: string; email: string; username: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessExpiresIn =
      (process.env.JWT_ACCESS_EXPIRES_IN as StringValue) || '15m';

    const newAccessToken = await this.jwtService.signAsync(
      {
        sub: payload.sub,
        email: payload.email,
        username: payload.username,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: accessExpiresIn,
      },
    );

    return {
      accessToken: newAccessToken,
    };
  }

  async logout(refreshToken: string) {
    const storedToken = await this.usersService.findRefreshToken(refreshToken);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.usersService.deleteRefreshToken(refreshToken);

    return {
      message: 'Logout successful',
    };
  }

  async verifyEmail(token: string) {
    const storedToken =
      await this.usersService.findEmailVerificationToken(token);

    if (!storedToken) {
      throw new BadRequestException('Invalid verification token');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.usersService.deleteEmailVerificationToken(token);
      throw new BadRequestException('Verification token expired');
    }

    await this.usersService.markEmailAsVerified(storedToken.userId);
    await this.usersService.deleteUserEmailVerificationTokens(
      storedToken.userId,
    );

    return {
      message: 'Email verified successfully',
    };
  }
}
