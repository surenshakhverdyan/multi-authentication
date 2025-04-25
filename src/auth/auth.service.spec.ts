/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { TokenService } from '../common/token/token.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { IGoogleProfile } from './providers/interfaces/google-profile.interface';
import { AppleProfile } from './providers/interfaces/apple-profile.interface';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInDto } from './dtos/sign-in.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let tokenService: TokenService;
  let cryptoService: CryptoService;

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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    tokenService = module.get<TokenService>(TokenService);
    cryptoService = module.get<CryptoService>(CryptoService);

    // Default mock implementations
    mockTokenService.generateAccessToken.mockReturnValue(
      mockTokens.accessToken,
    );
    mockTokenService.generateRefreshToken.mockReturnValue(
      mockTokens.refreshToken,
    );
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

      const result = await service.googleOauth(mockGoogleProfile);

      expect(userService.findByEmail).toHaveBeenCalledWith(
        mockGoogleProfile.email,
      );
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
        sub: mockUserId,
      });
      expect(tokenService.generateRefreshToken).toHaveBeenCalledWith({
        sub: mockUserId,
      });
      expect(result.user).toEqual({
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        picture: mockUser.picture,
      });
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
    });

    it('should create and login new user if not exists', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);

      const result = await service.googleOauth(mockGoogleProfile);

      expect(userService.create).toHaveBeenCalledWith(mockGoogleProfile);
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
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

      const result = await service.appleOauth(mockAppleProfile);

      expect(userService.findByEmail).toHaveBeenCalledWith(
        mockAppleProfile.email,
      );
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
        sub: mockUserId,
      });
      expect(tokenService.generateRefreshToken).toHaveBeenCalledWith({
        sub: mockUserId,
      });
      expect(result.user).toEqual({
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        picture: mockUser.picture,
      });
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
    });

    it('should create and login new user if not exists', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);

      const result = await service.appleOauth(mockAppleProfile);

      expect(userService.create).toHaveBeenCalledWith(mockAppleProfile);
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
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

      const result = await service.signUp(signUpDto);

      expect(cryptoService.hashPassword).toHaveBeenCalledWith(
        signUpDto.password,
      );
      expect(userService.create).toHaveBeenCalledWith({
        ...signUpDto,
        password: hashedPassword,
      });
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
    });
  });

  describe('signIn', () => {
    const signInDto: SignInDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should throw NotFoundException if user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(service.signIn(signInDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(userService.findByEmail).toHaveBeenCalledWith(signInDto.email);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockCryptoService.comparePassword.mockResolvedValue(false);

      await expect(service.signIn(signInDto)).rejects.toThrow(
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

      const result = await service.signIn(signInDto);

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
    });
  });
});
