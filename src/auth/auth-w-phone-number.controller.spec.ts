import { Test, TestingModule } from '@nestjs/testing';
import { AuthWPhoneNumberController } from './auth-w-phone-number.controller';

describe('AuthWPhoneNumberController', () => {
  let controller: AuthWPhoneNumberController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthWPhoneNumberController],
    }).compile();

    controller = module.get<AuthWPhoneNumberController>(
      AuthWPhoneNumberController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
