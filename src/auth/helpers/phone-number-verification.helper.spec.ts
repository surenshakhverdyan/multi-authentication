import { Test, TestingModule } from '@nestjs/testing';

import { PhoneNumberVerificationHelper } from './phone-number-verification.helper';
import { TwilioService } from '../../common/twilio/twilio.service';
import { SessionService } from '../../common/session/session.service';

describe('PhoneNumberVerificationHelper', () => {
  let helper: PhoneNumberVerificationHelper;

  const mockTwilioService = {
    sendVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  const mockSessionService = {
    create: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhoneNumberVerificationHelper,
        {
          provide: TwilioService,
          useValue: mockTwilioService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
      ],
    }).compile();

    helper = module.get<PhoneNumberVerificationHelper>(
      PhoneNumberVerificationHelper,
    );
  });

  it('should be defined', () => {
    expect(helper).toBeDefined();
  });
});
