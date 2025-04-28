import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TwilioModule as Twilio } from 'nestjs-twilio';

import { TwilioService } from './twilio.service';

@Module({
  imports: [
    Twilio.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        accountSid: configService.get<string>('TWILIO_ACCOUNT_SID'),
        authToken: configService.get<string>('TWILIO_AUTH_TOKEN'),
        from: configService.get<string>('TWILIO_PHONE_NUMBER'),
      }),
    }),
  ],
  providers: [TwilioService],
  exports: [TwilioService],
})
export class TwilioModule {}
