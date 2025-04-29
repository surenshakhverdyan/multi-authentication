import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { IGoogleProfile } from './providers/interfaces/google-profile.interface';
import { AppleProfile } from './providers/interfaces/apple-profile.interface';
import { JwtPayload } from 'src/common/token/interfaces/jwt-payload.interface';
import { IUser } from 'src/user/interfaces/user.interface';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { SignOutDto } from './dtos/sign-out.dto';
import { SessionService } from 'src/common/session/session.service';
import { ISession } from 'src/common/session/interfaces/session.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @ApiExcludeEndpoint()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request): Promise<IUser> {
    return this.authService.googleOauth(req.user as IGoogleProfile, req);
  }

  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  appleAuth() {}

  @ApiExcludeEndpoint()
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

  @ApiHeader({
    name: 'X-Refresh-Token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  refreshToken(@Body() payload: JwtPayload): { accessToken: string } {
    return this.authService.refreshToken(payload);
  }

  @ApiBearerAuth()
  @Get('all-sessions')
  getAllSessions(@Body('userId') userId: string): Promise<ISession[]> {
    return this.sessionService.getAllUserSessions(userId);
  }

  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Device-Id',
    example: '1ca60df7-6294-4834-bf21-525235e9502a',
  })
  @HttpCode(HttpStatus.OK)
  @Post('sign-out')
  async logout(@Body() dto: SignOutDto): Promise<void> {
    await this.authService.logout(dto.userId, dto.deviceId);
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('sign-out-all')
  async logoutAllDevices(@Body('userId') userId: string): Promise<void> {
    await this.authService.logoutAllDevices(userId);
  }
}
