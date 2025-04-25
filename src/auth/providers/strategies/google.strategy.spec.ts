/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { GoogleStrategy } from './google.strategy';
import { GoogleProfile } from '../interfaces/google-profile.interface';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_CLIENT_SECRET: 'test-client-secret',
        GOOGLE_CALLBACK_URL: 'test-callback-url',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate and transform Google profile', () => {
      const mockGoogleProfile: GoogleProfile = {
        id: '123456789',
        displayName: 'Test User',
        name: {
          familyName: 'User',
          givenName: 'Test',
        },
        emails: [{ value: 'test@example.com', verified: true }],
        photos: [{ value: 'https://example.com/photo.jpg' }],
        provider: 'google',
        _raw: '',
        _json: {
          sub: '123456789',
          name: 'Test User',
          given_name: 'Test',
          family_name: 'User',
          picture: 'https://example.com/photo.jpg',
          email: 'test@example.com',
          email_verified: true,
        },
      };

      const result = strategy.validate('', '', mockGoogleProfile);

      expect(result).toEqual({
        providerId: mockGoogleProfile.id,
        firstName: mockGoogleProfile.name.givenName,
        lastName: mockGoogleProfile.name.familyName,
        email: mockGoogleProfile.emails[0].value,
        picture: mockGoogleProfile.photos[0].value,
        provider: mockGoogleProfile.provider,
      });
    });
  });

  describe('configuration', () => {
    it('should use correct configuration from ConfigService', () => {
      expect(configService.get).toHaveBeenCalledWith('GOOGLE_CLIENT_ID');
      expect(configService.get).toHaveBeenCalledWith('GOOGLE_CLIENT_SECRET');
      expect(configService.get).toHaveBeenCalledWith('GOOGLE_CALLBACK_URL');
    });
  });
});
