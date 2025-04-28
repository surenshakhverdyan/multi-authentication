import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { IUser } from 'src/user/interfaces/user.interface';
import { AuthService } from './auth.service';
import { SignInByPhoneNumberDto } from './dtos/sign-in-by-phone-number.dto';

@Injectable()
export class AuthWPhoneNumberService extends AuthService {
  async signInWithPhoneNumber(
    dto: SignInByPhoneNumberDto,
    req: Request,
  ): Promise<IUser> {
    const user = await this.userService.findByPhoneNumber(dto.phoneNumber);
    if (!user) throw new NotFoundException('User not found');
    if (!user.password)
      throw new UnauthorizedException('Try signing in with Google or Apple');

    const isPasswordValid = await this.cryptoService.comparePassword(
      dto.password,
      user.password,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    return this.login(user, req);
  }
}
