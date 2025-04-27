import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi';

import { TokenModule } from './common/token/token.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { SessionModule } from './common/session/session.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        PORT: Joi.number().integer(),

        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),
        GOOGLE_CALLBACK_URL: Joi.string().required(),

        APPLE_CLIENT_ID: Joi.string().required(),
        APPLE_TEAM_ID: Joi.string().required(),
        APPLE_KEY_ID: Joi.string().required(),
        APPLE_PRIVATE_KEY_PATH: Joi.string().required(),
        APPLE_CALLBACK_URL: Joi.string().required(),

        REDIS_PORT: Joi.number().integer(),
        SESSION_TTL: Joi.number().integer(),
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        user: configService.get<string>('MONGODB_USER'),
        pass: configService.get<string>('MONGODB_PASS'),
        dbName: configService.get<string>('MONGODB_DB'),
      }),
    }),

    TokenModule,
    CryptoModule,
    SessionModule,
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
