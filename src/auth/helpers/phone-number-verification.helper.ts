import { Injectable, NotFoundException } from '@nestjs/common';

import { SessionService } from 'src/common/session/session.service';
import { TwilioService } from 'src/common/twilio/twilio.service';

@Injectable()
export class PhoneNumberVerificationHelper {
  constructor(
    private readonly twilioService: TwilioService,
    private readonly sessionService: SessionService,
  ) {}

  async sendVerificationCode(phoneNumber: string): Promise<void> {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const message = `Your verification code is: ${code}`;
    await this.sessionService.createVerificationCode(phoneNumber, code);
    await this.twilioService.sendSMS(message, phoneNumber);
  }

  async verifyCode(inputCode: string, phoneNumber: string): Promise<boolean> {
    const actualCode =
      await this.sessionService.getVerificationCode(phoneNumber);
    if (!actualCode) throw new NotFoundException('Verification code not found');
    const verified = inputCode === actualCode;
    if (verified) {
      await this.sessionService.changeVerificationCode(phoneNumber);
    }
    return verified;
  }

  async isCodeVerified(phoneNumber: string): Promise<boolean> {
    const code = await this.sessionService.getVerificationCode(phoneNumber);
    return code === 'verified';
  }
}
