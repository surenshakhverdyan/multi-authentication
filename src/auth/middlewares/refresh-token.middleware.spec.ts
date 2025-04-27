/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { UnauthorizedException } from '@nestjs/common';

import { RefreshTokenMiddleware } from './refresh-token.middleware';
import { TokenService } from '../../common/token/token.service';
import { JwtPayload } from '../../common/token/interfaces/jwt-payload.interface';

describe('RefreshTokenMiddleware', () => {
  let middleware: RefreshTokenMiddleware;
  let mockTokenService: jest.Mocked<TokenService>;

  const mockNext = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenMiddleware,
        {
          provide: TokenService,
          useValue: {
            verifyToken: jest.fn(),
          },
        },
      ],
    }).compile();

    middleware = module.get<RefreshTokenMiddleware>(RefreshTokenMiddleware);
    mockTokenService = module.get(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    const mockPayload: JwtPayload = {
      sub: 'testUserId',
      iat: 1234567890,
      exp: 1234567890,
    };

    it('should successfully process valid refresh token and clean payload', () => {
      const mockRequest = {
        headers: {
          'x-refresh-token': 'valid.token.here',
        },
        body: {},
      } as unknown as Request;

      mockTokenService.verifyToken.mockReturnValue({ ...mockPayload });

      middleware.use(mockRequest, {} as Response, mockNext);

      expect(mockTokenService.verifyToken).toHaveBeenCalledWith(
        'valid.token.here',
      );
      expect(mockRequest.body).toEqual({ sub: 'testUserId' });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when refresh token is missing', () => {
      const mockRequest = {
        headers: {},
        body: {},
      } as unknown as Request;

      expect(() => {
        middleware.use(mockRequest, {} as Response, mockNext);
      }).toThrow(new UnauthorizedException('Refresh token is missing'));

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when refresh token is invalid', () => {
      const mockRequest = {
        headers: {
          'x-refresh-token': 'invalid.token',
        },
        body: {},
      } as unknown as Request;

      mockTokenService.verifyToken.mockReturnValue(
        undefined as unknown as JwtPayload,
      );

      expect(() => {
        middleware.use(mockRequest, {} as Response, mockNext);
      }).toThrow(new UnauthorizedException('Invalid refresh token'));

      expect(mockTokenService.verifyToken).toHaveBeenCalledWith(
        'invalid.token',
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token verification fails', () => {
      const mockRequest = {
        headers: {
          'x-refresh-token': 'invalid.token',
        },
        body: {},
      } as unknown as Request;

      mockTokenService.verifyToken.mockImplementation(() => {
        throw new UnauthorizedException('Invalid refresh token');
      });

      expect(() => {
        middleware.use(mockRequest, {} as Response, mockNext);
      }).toThrow(new UnauthorizedException('Invalid refresh token'));

      expect(mockTokenService.verifyToken).toHaveBeenCalledWith(
        'invalid.token',
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
