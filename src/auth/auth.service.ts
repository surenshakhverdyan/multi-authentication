import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { CryptoService } from 'src/common/crypto/crypto.service';
import { TokenService } from 'src/common/token/token.service';
import { UserService } from 'src/user/user.service';
import { IGoogleProfile } from './providers/interfaces/google-profile.interface';
import { AppleProfile } from './providers/interfaces/apple-profile.interface';
import { User } from 'src/user/schemas/user.schema';
import { IUser } from 'src/user/interfaces/user.interface';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInDto } from './dtos/sign-in.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly cryptoService: CryptoService,
  ) {}

  async googleOauth(googleProfile: IGoogleProfile): Promise<IUser> {
    let user = await this.userService.findByEmail(googleProfile.email);
    if (!user) {
      user = await this.userService.create(googleProfile);
    }

    return this.login(user);
  }

  async appleOauth(appleProfile: AppleProfile): Promise<IUser> {
    let user = await this.userService.findByEmail(appleProfile.email);
    if (!user) {
      user = await this.userService.create(appleProfile);
    }

    return this.login(user);
  }

  async signUp(dto: SignUpDto): Promise<IUser> {
    const hashedPassword = await this.cryptoService.hashPassword(dto.password!);
    const user = await this.userService.create({
      ...dto,
      password: hashedPassword,
    });

    return this.login(user);
  }

  async signIn(dot: SignInDto): Promise<IUser> {
    const user = await this.userService.findByEmail(dot.email);
    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await this.cryptoService.comparePassword(
      dot.password,
      user.password,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    return this.login(user);
  }

  private login(user: User): IUser {
    const accessToken = this.tokenService.generateAccessToken({
      sub: user._id as Types.ObjectId,
    });
    const refreshToken = this.tokenService.generateRefreshToken({
      sub: user._id as Types.ObjectId,
    });

    return {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        picture: user?.picture,
      },
      accessToken,
      refreshToken,
    };
  }
}
