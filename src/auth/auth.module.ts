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

@Module({
  imports: [UserModule, TokenModule, CryptoModule, SessionModule],
  providers: [AuthService, GoogleStrategy, AppleStrategy],
  controllers: [AuthController],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RefreshTokenMiddleware).forRoutes('auth/refresh-token');
  }
}
