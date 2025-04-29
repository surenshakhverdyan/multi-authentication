import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './providers/strategies/google.strategy';
import { UserModule } from 'src/user/user.module';
import { TokenModule } from 'src/common/token/token.module';
import { CryptoModule } from 'src/common/crypto/crypto.module';
import { SessionModule } from 'src/common/session/session.module';
import { AppleStrategy } from './providers/strategies/apple.strategy';
import { RefreshTokenMiddleware } from './middlewares/refresh-token.middleware';
import { SignOutSingleSessionMiddleware } from './middlewares/sign-out-single-session.middleware';
import { SignOutAllSessionsMiddleware } from './middlewares/sign-out-all-sessions.middleware';
import { TwilioModule } from 'src/common/twilio/twilio.module';
import { PhoneNumberVerificationHelper } from './helpers/phone-number-verification.helper';
import { AuthWPhoneNumberService } from './auth-w-phone-number.service';
import { AuthWPhoneNumberController } from './auth-w-phone-number.controller';

@Module({
  imports: [UserModule, TokenModule, CryptoModule, SessionModule, TwilioModule],
  providers: [
    AuthService,
    GoogleStrategy,
    AppleStrategy,
    PhoneNumberVerificationHelper,
    AuthWPhoneNumberService,
  ],
  controllers: [AuthController, AuthWPhoneNumberController],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RefreshTokenMiddleware).forRoutes('auth/refresh-token');
    consumer.apply(SignOutSingleSessionMiddleware).forRoutes('auth/sign-out');
    consumer.apply(SignOutAllSessionsMiddleware).forRoutes('auth/sign-out-all');
    consumer
      .apply(SignOutAllSessionsMiddleware)
      .forRoutes('/auth/all-sessions');
  }
}
