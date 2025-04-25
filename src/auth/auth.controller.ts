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
import { Request } from 'express';

import { AuthService } from './auth.service';
import { IGoogleProfile } from './providers/interfaces/google-profile.interface';
import { AppleProfile } from './providers/interfaces/apple-profile.interface';
import { IUser } from 'src/user/interfaces/user.interface';
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
    return this.authService.googleOauth(req.user as IGoogleProfile);
  }

  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  appleAuth() {}

  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  appleAuthRedirect(@Req() req: Request): Promise<IUser> {
    return this.authService.appleOauth(req.user as AppleProfile);
  }

  @Post('sign-up')
  signUp(@Body() dto: SignUpDto): Promise<IUser> {
    return this.authService.signUp(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  signIn(@Body() dto: SignInDto): Promise<IUser> {
    return this.authService.signIn(dto);
  }
}
