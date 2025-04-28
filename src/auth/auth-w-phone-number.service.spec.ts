import { Test, TestingModule } from '@nestjs/testing';

import { AuthWPhoneNumberService } from './auth-w-phone-number.service';
import { UserService } from '../user/user.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { TokenService } from '../common/token/token.service';
import { SessionService } from '../common/session/session.service';
import { PhoneNumberVerificationHelper } from './helpers/phone-number-verification.helper';

describe('AuthWPhoneNumberService', () => {
  let service: AuthWPhoneNumberService;

  const mockUserService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findByPhoneNumber: jest.fn(),
  };

  const mockCryptoService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const mockTokenService = {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    verifyToken: jest.fn(),
  };

  const mockSessionService = {
    create: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockPhoneNumberVerificationHelper = {
    sendVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthWPhoneNumberService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
        {
          provide: PhoneNumberVerificationHelper,
          useValue: mockPhoneNumberVerificationHelper,
        },
      ],
    }).compile();

    service = module.get<AuthWPhoneNumberService>(AuthWPhoneNumberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
