/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { AppleStrategy } from './apple.strategy';

describe('AppleStrategy', () => {
  let strategy: AppleStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        APPLE_CLIENT_ID: 'test-client-id',
        APPLE_TEAM_ID: 'test-team-id',
        APPLE_KEY_ID: 'test-key-id',
        APPLE_PRIVATE_KEY_PATH: 'test-private-key-path',
        APPLE_CALLBACK_URL: 'test-callback-url',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppleStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<AppleStrategy>(AppleStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate and transform Apple profile with data from request body', () => {
      const mockReq = {
        body: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        },
      } as Request;

      const mockProfile = {
        id: '123456789',
        email: 'test@example.com',
      };

      const result = strategy.validate(
        mockReq,
        'test-access-token',
        'test-refresh-token',
        mockProfile,
      );

      expect(result).toEqual({
        provider: 'apple',
        providerId: mockProfile.id,
        firstName: mockReq.body.firstName,
        lastName: mockReq.body.lastName,
        email: mockReq.body.email,
        picture: '',
      });
    });

    it('should handle missing body data and use profile data', () => {
      const mockReq = {
        body: {},
      } as Request;

      const mockProfile = {
        id: '123456789',
        email: 'test@example.com',
      };

      const result = strategy.validate(
        mockReq,
        'test-access-token',
        'test-refresh-token',
        mockProfile,
      );

      expect(result).toEqual({
        provider: 'apple',
        providerId: mockProfile.id,
        firstName: '',
        lastName: '',
        email: mockProfile.email,
        picture: '',
      });
    });

    it('should handle undefined profile id and email', () => {
      const mockReq = {
        body: {},
      } as Request;

      const mockProfile = {};

      const result = strategy.validate(
        mockReq,
        'test-access-token',
        'test-refresh-token',
        mockProfile,
      );

      expect(result).toEqual({
        provider: 'apple',
        providerId: '',
        firstName: '',
        lastName: '',
        email: '',
        picture: '',
      });
    });
  });

  describe('configuration', () => {
    it('should use correct configuration from ConfigService', () => {
      expect(configService.get).toHaveBeenCalledWith('APPLE_CLIENT_ID');
      expect(configService.get).toHaveBeenCalledWith('APPLE_TEAM_ID');
      expect(configService.get).toHaveBeenCalledWith('APPLE_KEY_ID');
      expect(configService.get).toHaveBeenCalledWith('APPLE_PRIVATE_KEY_PATH');
      expect(configService.get).toHaveBeenCalledWith('APPLE_CALLBACK_URL');
    });
  });
});
