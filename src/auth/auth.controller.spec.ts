/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { IGoogleProfile } from './providers/interfaces/google-profile.interface';
import { AppleProfile } from './providers/interfaces/apple-profile.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser = {
    user: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      picture: 'test.jpg',
    },
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  };

  const mockAuthService = {
    googleOauth: jest.fn(),
    appleOauth: jest.fn(),
    signUp: jest.fn(),
    signIn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleAuth', () => {
    it('should be defined', () => {
      expect(controller.googleAuth).toBeDefined();
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
        user: mockGoogleProfile,
      } as any);

      expect(service.googleOauth).toHaveBeenCalledWith(mockGoogleProfile);
      expect(result).toEqual(mockUser);
    });
  });

  describe('appleAuth', () => {
    it('should be defined', () => {
      expect(controller.appleAuth).toBeDefined();
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
        user: mockAppleProfile,
      } as any);

      expect(service.appleOauth).toHaveBeenCalledWith(mockAppleProfile);
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

      const result = await controller.signUp(signUpDto);

      expect(service.signUp).toHaveBeenCalledWith(signUpDto);
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

      const result = await controller.signIn(signInDto);

      expect(service.signIn).toHaveBeenCalledWith(signInDto);
      expect(result).toEqual(mockUser);
    });
  });
});
