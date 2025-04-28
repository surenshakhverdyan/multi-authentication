import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { Request } from 'express';

import { CryptoService } from 'src/common/crypto/crypto.service';
import { TokenService } from 'src/common/token/token.service';
import { SessionService } from 'src/common/session/session.service';
import { UserService } from 'src/user/user.service';
import { IGoogleProfile } from './providers/interfaces/google-profile.interface';
import { JwtPayload } from 'src/common/token/interfaces/jwt-payload.interface';
import { AppleProfile } from './providers/interfaces/apple-profile.interface';
import { User } from 'src/user/schemas/user.schema';
import { IUser } from 'src/user/interfaces/user.interface';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { PhoneNumberVerificationHelper } from './helpers/phone-number-verification.helper';

@Injectable()
export class AuthService {
  constructor(
    protected readonly userService: UserService,
    protected readonly cryptoService: CryptoService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly helper: PhoneNumberVerificationHelper,
  ) {}

  async googleOauth(
    googleProfile: IGoogleProfile,
    req: Request,
  ): Promise<IUser> {
    let user = await this.userService.findByEmail(googleProfile.email);
    if (!user) {
      user = await this.userService.create(googleProfile);
    }

    return this.login(user, req);
  }

  async appleOauth(appleProfile: AppleProfile, req: Request): Promise<IUser> {
    let user = await this.userService.findByEmail(appleProfile.email);
    if (!user) {
      user = await this.userService.create(appleProfile);
    }

    return this.login(user, req);
  }

  async signUp(dto: SignUpDto, req: Request): Promise<IUser> {
    if (dto.phoneNumber) {
      const isVerified = await this.helper.isCodeVerified(dto.phoneNumber);
      if (!isVerified)
        throw new UnauthorizedException('Phone number not verified');
    }
    const hashedPassword = await this.cryptoService.hashPassword(dto.password!);
    const user = await this.userService.create({
      ...dto,
      password: hashedPassword,
    });

    return this.login(user, req);
  }

  async signIn(dto: SignInDto, req: Request): Promise<IUser> {
    const user = await this.userService.findByEmail(dto.email);
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

  refreshToken(payload: JwtPayload): { accessToken: string } {
    const accessToken = this.tokenService.generateAccessToken(payload);
    return { accessToken };
  }

  async logout(userId: string, deviceId: string): Promise<void> {
    await this.sessionService.removeSession(userId, deviceId);
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.sessionService.removeAllSessions(userId);
  }

  protected async login(user: User, req: Request): Promise<IUser> {
    const accessToken = this.tokenService.generateAccessToken({
      sub: user._id as Types.ObjectId,
    });
    const refreshToken = this.tokenService.generateRefreshToken({
      sub: user._id as Types.ObjectId,
    });

    const session = await this.sessionService.createSession({
      userId: user._id as Types.ObjectId,
      ip: req.ip as string,
      userAgent: req.headers['user-agent'] || 'unknown',
      lastActivity: new Date(Date.now()),
    });

    return {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user?.phoneNumber,
        picture: user?.picture,
      },
      accessToken,
      refreshToken,
      deviceId: session.deviceId,
    };
  }
}
