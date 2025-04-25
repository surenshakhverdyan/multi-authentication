import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { Request } from 'express';

import { AppleProfile } from '../interfaces/apple-profile.interface';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('APPLE_CLIENT_ID')!,
      teamID: configService.get<string>('APPLE_TEAM_ID')!,
      keyID: configService.get<string>('APPLE_KEY_ID')!,
      privateKeyLocation: configService.get<string>('APPLE_PRIVATE_KEY_PATH')!,
      callbackURL: configService.get<string>('APPLE_CALLBACK_URL')!,
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Partial<any>,
  ): AppleProfile {
    const body = req.body as AppleProfile;

    return {
      provider: 'apple',
      providerId: typeof profile.id === 'string' ? profile.id : '',
      firstName: body.firstName || '',
      lastName: body.lastName || '',
      email:
        body.email || (typeof profile.email === 'string' ? profile.email : ''),
      picture: '',
    };
  }
}
