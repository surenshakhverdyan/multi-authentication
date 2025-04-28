import { Test, TestingModule } from '@nestjs/testing';

import { AuthWPhoneNumberController } from './auth-w-phone-number.controller';
import { AuthWPhoneNumberService } from './auth-w-phone-number.service';
import { PhoneNumberVerificationHelper } from './helpers/phone-number-verification.helper';

describe('AuthWPhoneNumberController', () => {
  let controller: AuthWPhoneNumberController;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
  };

  const mockPhoneNumberVerificationHelper = {
    sendVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthWPhoneNumberController],
      providers: [
        {
          provide: AuthWPhoneNumberService,
          useValue: mockAuthService,
        },
        {
          provide: PhoneNumberVerificationHelper,
          useValue: mockPhoneNumberVerificationHelper,
        },
      ],
    }).compile();

    controller = module.get<AuthWPhoneNumberController>(
      AuthWPhoneNumberController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
