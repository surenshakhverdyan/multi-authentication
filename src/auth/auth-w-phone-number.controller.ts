import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';
import { Request } from 'express';

import { PhoneNumberVerificationHelper } from './helpers/phone-number-verification.helper';
import { SignInByPhoneNumberDto } from './dtos/sign-in-by-phone-number.dto';
import { IUser } from 'src/user/interfaces/user.interface';
import { AuthWPhoneNumberService } from './auth-w-phone-number.service';

@Controller('auth')
export class AuthWPhoneNumberController {
  constructor(
    private readonly helper: PhoneNumberVerificationHelper,
    private readonly authWPhoneNumberService: AuthWPhoneNumberService,
  ) {}

  @ApiParam({
    name: 'phoneNumber',
    example: '+1234567890',
  })
  @Post('get-otp/:phoneNumber')
  getOtp(@Param('phoneNumber') phoneNumber: string): Promise<void> {
    return this.helper.sendVerificationCode(phoneNumber);
  }

  @ApiParam({
    name: 'phoneNumber',
    example: '+1234567890',
  })
  @ApiParam({
    name: 'code',
    example: '1234',
  })
  @HttpCode(HttpStatus.OK)
  @Post('verify-otp/:phoneNumber/:code')
  verifyOtp(
    @Param('phoneNumber') phoneNumber: string,
    @Param('code') code: string,
  ): Promise<boolean> {
    return this.helper.verifyCode(code, phoneNumber);
  }

  @Post('sign-in-w-phone-number')
  @HttpCode(HttpStatus.OK)
  signInWithPhoneNumber(
    @Body() dto: SignInByPhoneNumberDto,
    @Req() req: Request,
  ): Promise<IUser> {
    return this.authWPhoneNumberService.signInWithPhoneNumber(dto, req);
  }
}
