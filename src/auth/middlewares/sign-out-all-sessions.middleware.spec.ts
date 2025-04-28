/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';

import { SignOutAllSessionsMiddleware } from './sign-out-all-sessions.middleware';
import { TokenService } from '../../common/token/token.service';

describe('SignOutAllSessionsMiddleware', () => {
  let middleware: SignOutAllSessionsMiddleware;
  let tokenService: TokenService;

  const mockTokenService = {
    extractTokenFromRequest: jest.fn(),
    verifyToken: jest.fn(),
  };

  const mockNext = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignOutAllSessionsMiddleware,
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
      ],
    }).compile();

    middleware = module.get<SignOutAllSessionsMiddleware>(
      SignOutAllSessionsMiddleware,
    );
    tokenService = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer valid.token.here',
      },
      body: {},
    } as unknown as Request;

    it('should successfully process valid token and set userId in request body', () => {
      const mockPayload = { sub: 'testUserId' };
      mockTokenService.extractTokenFromRequest.mockReturnValue(
        'valid.token.here',
      );
      mockTokenService.verifyToken.mockReturnValue(mockPayload);

      middleware.use(mockRequest, {} as Response, mockNext);

      expect(tokenService.extractTokenFromRequest).toHaveBeenCalledWith(
        mockRequest,
      );
      expect(tokenService.verifyToken).toHaveBeenCalledWith('valid.token.here');
      expect(mockRequest.body).toEqual({ userId: mockPayload.sub });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is missing', () => {
      mockTokenService.extractTokenFromRequest.mockReturnValue(null);

      expect(() => {
        middleware.use(mockRequest, {} as Response, mockNext);
      }).toThrow(new UnauthorizedException('Token not found'));

      expect(tokenService.extractTokenFromRequest).toHaveBeenCalledWith(
        mockRequest,
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token verification fails', () => {
      mockTokenService.extractTokenFromRequest.mockReturnValue('invalid.token');
      mockTokenService.verifyToken.mockImplementation(() => {
        throw new UnauthorizedException('Invalid token');
      });

      expect(() => {
        middleware.use(mockRequest, {} as Response, mockNext);
      }).toThrow(UnauthorizedException);

      expect(tokenService.extractTokenFromRequest).toHaveBeenCalledWith(
        mockRequest,
      );
      expect(tokenService.verifyToken).toHaveBeenCalledWith('invalid.token');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
