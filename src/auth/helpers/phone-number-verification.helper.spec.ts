import { Test, TestingModule } from '@nestjs/testing';
import { PhoneNumberVerificationHelper } from './phone-number-verification.helper';

describe('PhoneNumberVerificationHelper', () => {
  let provider: PhoneNumberVerificationHelper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PhoneNumberVerificationHelper],
    }).compile();

    provider = module.get<PhoneNumberVerificationHelper>(
      PhoneNumberVerificationHelper,
    );
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
