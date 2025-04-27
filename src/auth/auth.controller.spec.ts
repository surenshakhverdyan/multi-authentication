/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { IGoogleProfile } from './providers/interfaces/google-profile.interface';
import { AppleProfile } from './providers/interfaces/apple-profile.interface';
import { JwtPayload } from '../common/token/interfaces/jwt-payload.interface';
import { TokenService } from '../common/token/token.service';
import { SessionService } from '../common/session/session.service';
import { AuthGuard } from './guards/auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockRequest = {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-user-agent',
    },
  } as unknown as Request;

  const mockUser = {
    user: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      picture: 'test.jpg',
    },
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    deviceId: 'test-device-id',
  };

  const mockAuthService = {
    googleOauth: jest.fn(),
    appleOauth: jest.fn(),
    signUp: jest.fn(),
    signIn: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    logoutAllDevices: jest.fn(),
  };

  const mockTokenService = {
    extractTokenFromRequest: jest.fn(),
    verifyToken: jest.fn(),
  };

  const mockSessionService = {
    getSession: jest.fn(),
    updateSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
        AuthGuard,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    mockTokenService.extractTokenFromRequest.mockReturnValue('valid-token');
    mockTokenService.verifyToken.mockReturnValue({ sub: 'test-user-id' });
    mockSessionService.getSession.mockResolvedValue({ id: 'test-session' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleAuth', () => {
    it('should be defined', () => {
      expect(controller.googleAuth()).toBeUndefined();
    });
  });

  describe('googleAuthRedirect', () => {
    it('should call authService.googleOauth with user profile', async () => {
      const mockGoogleProfile: IGoogleProfile = {
        provider: 'google',
        providerId: '123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        picture: 'test.jpg',
      };

      mockAuthService.googleOauth.mockResolvedValue(mockUser);

      const result = await controller.googleAuthRedirect({
        ...mockRequest,
        user: mockGoogleProfile,
      } as any);

      expect(service.googleOauth).toHaveBeenCalledWith(
        mockGoogleProfile,
        expect.any(Object),
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('appleAuth', () => {
    it('should be defined', () => {
      expect(controller.appleAuth()).toBeUndefined();
    });
  });

  describe('appleAuthRedirect', () => {
    it('should call authService.appleOauth with user profile', async () => {
      const mockAppleProfile: AppleProfile = {
        provider: 'apple',
        providerId: '123',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        picture: 'test.jpg',
      };

      mockAuthService.appleOauth.mockResolvedValue(mockUser);

      const result = await controller.appleAuthRedirect({
        ...mockRequest,
        user: mockAppleProfile,
      } as any);

      expect(service.appleOauth).toHaveBeenCalledWith(
        mockAppleProfile,
        expect.any(Object),
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('signUp', () => {
    it('should call authService.signUp with dto', async () => {
      const signUpDto: SignUpDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      mockAuthService.signUp.mockResolvedValue(mockUser);

      const result = await controller.signUp(signUpDto, mockRequest);

      expect(service.signUp).toHaveBeenCalledWith(signUpDto, mockRequest);
      expect(result).toEqual(mockUser);
    });
  });

  describe('signIn', () => {
    it('should call authService.signIn with dto', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.signIn.mockResolvedValue(mockUser);

      const result = await controller.signIn(signInDto, mockRequest);

      expect(service.signIn).toHaveBeenCalledWith(signInDto, mockRequest);
      expect(result).toEqual(mockUser);
    });
  });

  describe('refreshToken', () => {
    it('should call authService.refreshToken with payload', () => {
      const payload: JwtPayload = { sub: 'testUserId' };
      const mockAccessToken = { accessToken: 'new-access-token' };

      mockAuthService.refreshToken.mockReturnValue(mockAccessToken);

      const result = controller.refreshToken(payload);

      expect(service.refreshToken).toHaveBeenCalledWith(payload);
      expect(result).toEqual(mockAccessToken);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with userId and deviceId', async () => {
      const userId = 'testUserId';
      const deviceId = 'testDeviceId';

      await controller.logout(userId, deviceId);

      expect(service.logout).toHaveBeenCalledWith(userId, deviceId);
    });
  });

  describe('logoutAllDevices', () => {
    it('should call authService.logoutAllDevices with userId', async () => {
      const userId = 'testUserId';

      await controller.logoutAllDevices(userId);

      expect(service.logoutAllDevices).toHaveBeenCalledWith(userId);
    });
  });
});
