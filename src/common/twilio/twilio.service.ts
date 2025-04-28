import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TwilioService as Twilio } from 'nestjs-twilio';

@Injectable()
export class TwilioService {
  constructor(
    private readonly configService: ConfigService,
    private readonly twilio: Twilio,
  ) {}

  async sendSMS(message: string, to: string): Promise<void> {
    try {
      await this.twilio.client.messages.create({
        body: message,
        from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
        to,
      });
    } catch {
      throw new BadRequestException(
        'Failed to send SMS. Please try again later',
      );
    }
  }
}
