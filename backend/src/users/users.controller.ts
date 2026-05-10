// src/users/users.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMyProfile(
    @CurrentUser()
    user: {
      userId: string;
      email: string;
      username: string;
    },
  ) {
    return this.usersService.findPublicById(user.userId);
  }

  @Patch('me')
  updateMyProfile(
    @CurrentUser()
    user: { userId: string; email: string; username: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Delete('me')
  deleteMyAccount(
    @CurrentUser()
    user: {
      userId: string;
      email: string;
      username: string;
    },
  ) {
    return this.usersService.deleteMyAccount(user.userId);
  }
}
