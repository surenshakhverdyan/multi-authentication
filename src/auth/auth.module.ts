import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './providers/strategies/google.strategy';
import { UserModule } from 'src/user/user.module';
import { TokenModule } from 'src/common/token/token.module';
import { CryptoModule } from 'src/common/crypto/crypto.module';
import { AppleStrategy } from './providers/strategies/apple.strategy';

@Module({
  imports: [UserModule, TokenModule, CryptoModule],
  providers: [AuthService, GoogleStrategy, AppleStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
