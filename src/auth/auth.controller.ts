import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { IGoogleProfile } from './providers/interfaces/google-profile.interface';
import { AppleProfile } from './providers/interfaces/apple-profile.interface';
import { JwtPayload } from 'src/common/token/interfaces/jwt-payload.interface';
import { IUser } from 'src/user/interfaces/user.interface';
import { AuthGuard as _AuthGuard } from './guards/auth.guard';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInDto } from './dtos/sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request): Promise<IUser> {
    return this.authService.googleOauth(req.user as IGoogleProfile, req);
  }

  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  appleAuth() {}

  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  appleAuthRedirect(@Req() req: Request): Promise<IUser> {
    return this.authService.appleOauth(req.user as AppleProfile, req);
  }

  @Post('sign-up')
  signUp(@Body() dto: SignUpDto, @Req() req: Request): Promise<IUser> {
    return this.authService.signUp(dto, req);
  }

  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  signIn(@Body() dto: SignInDto, @Req() req: Request): Promise<IUser> {
    return this.authService.signIn(dto, req);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  refreshToken(@Body() payload: JwtPayload): { accessToken: string } {
    return this.authService.refreshToken(payload);
  }

  @UseGuards(_AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout/:userId/:deviceId')
  async logout(
    @Param('userId') userId: string,
    @Param('deviceId') deviceId: string,
  ): Promise<void> {
    await this.authService.logout(userId, deviceId);
  }

  @UseGuards(_AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout-all/:userId')
  async logoutAllDevices(@Param('userId') userId: string): Promise<void> {
    await this.authService.logoutAllDevices(userId);
  }
}
