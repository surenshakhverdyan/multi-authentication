import { Test, TestingModule } from '@nestjs/testing';
import { AuthWPhoneNumberService } from './auth-w-phone-number.service';

describe('AuthWPhoneNumberService', () => {
  let service: AuthWPhoneNumberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthWPhoneNumberService],
    }).compile();

    service = module.get<AuthWPhoneNumberService>(AuthWPhoneNumberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
