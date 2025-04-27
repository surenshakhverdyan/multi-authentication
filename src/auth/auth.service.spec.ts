/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { TokenService } from '../common/token/token.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { SessionService } from '../common/session/session.service';
import { IGoogleProfile } from './providers/interfaces/google-profile.interface';
import { AppleProfile } from './providers/interfaces/apple-profile.interface';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInDto } from './dtos/sign-in.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let tokenService: TokenService;
  let cryptoService: CryptoService;
  let sessionService: SessionService;

  const mockUserId = new Types.ObjectId();
  const mockUser = {
    _id: mockUserId,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword123',
    picture: 'test.jpg',
  };

  const mockTokens = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  };

  const mockSession = {
    deviceId: 'test-device-id',
  };

  const mockRequest = {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-user-agent',
    },
  } as unknown as Request;

  const mockUserService = {
    findByEmail: jest.fn(),
    findByProviderId: jest.fn(),
    create: jest.fn(),
  };

  const mockTokenService = {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
  };

  const mockCryptoService = {
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
  };

  const mockSessionService = {
    createSession: jest.fn(),
    removeSession: jest.fn(),
    removeAllSessions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    tokenService = module.get<TokenService>(TokenService);
    cryptoService = module.get<CryptoService>(CryptoService);
    sessionService = module.get<SessionService>(SessionService);

    mockTokenService.generateAccessToken.mockReturnValue(
      mockTokens.accessToken,
    );
    mockTokenService.generateRefreshToken.mockReturnValue(
      mockTokens.refreshToken,
    );
    mockSessionService.createSession.mockResolvedValue(mockSession);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('googleOauth', () => {
    const mockGoogleProfile: IGoogleProfile = {
      provider: 'google',
      providerId: '123',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      picture: 'test.jpg',
    };

    it('should login existing user', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.googleOauth(mockGoogleProfile, mockRequest);

      expect(userService.findByEmail).toHaveBeenCalledWith(
        mockGoogleProfile.email,
      );
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
        sub: mockUserId,
      });
      expect(tokenService.generateRefreshToken).toHaveBeenCalledWith({
        sub: mockUserId,
      });
      expect(sessionService.createSession).toHaveBeenCalledWith({
        userId: mockUserId,
        ip: mockRequest.ip,
        userAgent: mockRequest.headers['user-agent'],
        lastActivity: expect.any(Date),
      });
      expect(result).toEqual({
        user: {
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email,
          picture: mockUser.picture,
        },
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        deviceId: mockSession.deviceId,
      });
    });

    it('should create and login new user if not exists', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);

      const result = await service.googleOauth(mockGoogleProfile, mockRequest);

      expect(userService.create).toHaveBeenCalledWith(mockGoogleProfile);
      expect(sessionService.createSession).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
      expect(result.deviceId).toBe(mockSession.deviceId);
    });
  });

  describe('appleOauth', () => {
    const mockAppleProfile: AppleProfile = {
      provider: 'apple',
      providerId: '123',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      picture: 'test.jpg',
    };

    it('should login existing user', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.appleOauth(mockAppleProfile, mockRequest);

      expect(userService.findByEmail).toHaveBeenCalledWith(
        mockAppleProfile.email,
      );
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
        sub: mockUserId,
      });
      expect(tokenService.generateRefreshToken).toHaveBeenCalledWith({
        sub: mockUserId,
      });
      expect(sessionService.createSession).toHaveBeenCalledWith({
        userId: mockUserId,
        ip: mockRequest.ip,
        userAgent: mockRequest.headers['user-agent'],
        lastActivity: expect.any(Date),
      });
      expect(result).toEqual({
        user: {
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email,
          picture: mockUser.picture,
        },
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        deviceId: mockSession.deviceId,
      });
    });

    it('should create and login new user if not exists', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);

      const result = await service.appleOauth(mockAppleProfile, mockRequest);

      expect(userService.create).toHaveBeenCalledWith(mockAppleProfile);
      expect(sessionService.createSession).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
      expect(result.deviceId).toBe(mockSession.deviceId);
    });
  });

  describe('signUp', () => {
    const signUpDto: SignUpDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should create new user and return tokens', async () => {
      const hashedPassword = 'hashedPassword123';
      mockCryptoService.hashPassword.mockResolvedValue(hashedPassword);
      mockUserService.create.mockResolvedValue(mockUser);

      const result = await service.signUp(signUpDto, mockRequest);

      expect(cryptoService.hashPassword).toHaveBeenCalledWith(
        signUpDto.password,
      );
      expect(userService.create).toHaveBeenCalledWith({
        ...signUpDto,
        password: hashedPassword,
      });
      expect(sessionService.createSession).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
      expect(result.deviceId).toBe(mockSession.deviceId);
    });
  });

  describe('signIn', () => {
    const signInDto: SignInDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should throw NotFoundException if user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(service.signIn(signInDto, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(userService.findByEmail).toHaveBeenCalledWith(signInDto.email);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockCryptoService.comparePassword.mockResolvedValue(false);

      await expect(service.signIn(signInDto, mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(cryptoService.comparePassword).toHaveBeenCalledWith(
        signInDto.password,
        mockUser.password,
      );
    });

    it('should return user and tokens if credentials are valid', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockCryptoService.comparePassword.mockResolvedValue(true);

      const result = await service.signIn(signInDto, mockRequest);

      expect(sessionService.createSession).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
      expect(result.deviceId).toBe(mockSession.deviceId);
    });
  });

  describe('refreshToken', () => {
    const mockPayload = { sub: mockUserId };

    it('should return new access token', () => {
      const result = service.refreshToken(mockPayload);

      expect(tokenService.generateAccessToken).toHaveBeenCalledWith(
        mockPayload,
      );
      expect(result).toEqual({ accessToken: mockTokens.accessToken });
    });
  });

  describe('logout', () => {
    it('should remove session', async () => {
      const userId = 'testUserId';
      const deviceId = 'testDeviceId';

      await service.logout(userId, deviceId);

      expect(sessionService.removeSession).toHaveBeenCalledWith(
        userId,
        deviceId,
      );
    });
  });

  describe('logoutAllDevices', () => {
    it('should remove all sessions', async () => {
      const userId = 'testUserId';

      await service.logoutAllDevices(userId);

      expect(sessionService.removeAllSessions).toHaveBeenCalledWith(userId);
    });
  });
});
