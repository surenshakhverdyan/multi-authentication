import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

import { TokenService } from './token.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;
  const mockPayload: JwtPayload = {
    sub: '123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET') || 'test-secret',
            signOptions: {
              expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1d',
            },
          }),
        }),
      ],
      providers: [TokenService],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const token = service.generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include the correct payload in the token', () => {
      const token = service.generateAccessToken(mockPayload);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const decoded = jwtService.decode(token) as JwtPayload;

      expect(decoded.sub).toBe(mockPayload.sub);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token with extended expiration', () => {
      const token = service.generateRefreshToken(mockPayload);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const decoded = jwtService.decode(token) as JwtPayload & { exp: number };

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      // Verify token expiration is about 7 days (with 1 minute tolerance)
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;
      const expectedExp = Math.floor(Date.now() / 1000) + sevenDaysInSeconds;
      expect(decoded.exp).toBeGreaterThan(expectedExp - 60);
      expect(decoded.exp).toBeLessThan(expectedExp + 60);
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify a valid token', () => {
      const token = service.generateAccessToken(mockPayload);
      const verified = service.verifyToken(token);

      expect(verified.sub).toBe(mockPayload.sub);
    });

    it('should throw UnauthorizedException for invalid token', () => {
      expect(() => service.verifyToken('invalid-token')).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired token', () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('jwt expired');
      });

      expect(() => service.verifyToken('expired-token')).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('extractTokenFromRequest', () => {
    it('should extract token from valid Authorization header', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      } as Request;

      const token = service.extractTokenFromRequest(mockRequest);
      expect(token).toBe('valid-token');
    });

    it('should return null for missing Authorization header', () => {
      const mockRequest = {
        headers: {},
      } as Request;

      const token = service.extractTokenFromRequest(mockRequest);
      expect(token).toBeNull();
    });

    it('should return null for non-Bearer Authorization header', () => {
      const mockRequest = {
        headers: {
          authorization: 'Basic valid-token',
        },
      } as Request;

      const token = service.extractTokenFromRequest(mockRequest);
      expect(token).toBeNull();
    });
  });
});
