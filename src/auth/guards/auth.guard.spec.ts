/* eslint-disable @typescript-eslint/unbound-method */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { AuthGuard } from './auth.guard';
import { TokenService } from '../../common/token/token.service';
import { SessionService } from '../../common/session/session.service';
import { ISession } from '../../common/session/interfaces/session.interface';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let tokenService: TokenService;
  let sessionService: SessionService;

  const mockUserId = new Types.ObjectId();
  const mockDeviceId = 'test-device-id';
  const mockToken = 'valid-token';

  const mockSession: ISession = {
    userId: mockUserId,
    deviceId: mockDeviceId,
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    lastActivity: new Date(),
  };

  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          authorization: `Bearer ${mockToken}`,
          'x-device-id': mockDeviceId,
        },
      }),
    }),
  } as ExecutionContext;

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
      providers: [
        AuthGuard,
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    tokenService = module.get<TokenService>(TokenService);
    sessionService = module.get<SessionService>(SessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid token and active session', async () => {
      mockTokenService.extractTokenFromRequest.mockReturnValue(mockToken);
      mockTokenService.verifyToken.mockReturnValue({ sub: mockUserId });
      mockSessionService.getSession.mockResolvedValue(mockSession);
      mockSessionService.updateSession.mockResolvedValue(undefined);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(tokenService.extractTokenFromRequest).toHaveBeenCalled();
      expect(tokenService.verifyToken).toHaveBeenCalledWith(mockToken);
      expect(sessionService.getSession).toHaveBeenCalledWith(
        mockUserId.toString(),
        mockDeviceId,
      );
      expect(sessionService.updateSession).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      mockTokenService.extractTokenFromRequest.mockReturnValue(null);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('Access token is missing'),
      );
    });

    it('should throw UnauthorizedException when device ID is missing', async () => {
      const contextWithoutDeviceId = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: `Bearer ${mockToken}`,
            },
          }),
        }),
      } as ExecutionContext;

      mockTokenService.extractTokenFromRequest.mockReturnValue(mockToken);
      mockTokenService.verifyToken.mockReturnValue({ sub: mockUserId });

      await expect(guard.canActivate(contextWithoutDeviceId)).rejects.toThrow(
        new UnauthorizedException('Device ID is missing'),
      );
    });

    it('should throw UnauthorizedException when session not found', async () => {
      mockTokenService.extractTokenFromRequest.mockReturnValue(mockToken);
      mockTokenService.verifyToken.mockReturnValue({ sub: mockUserId });
      mockSessionService.getSession.mockResolvedValue(null);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('Session not found'),
      );
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      mockTokenService.extractTokenFromRequest.mockReturnValue(mockToken);
      mockTokenService.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new UnauthorizedException('Invalid token'),
      );
    });
  });
});
