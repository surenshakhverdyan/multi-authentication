/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TwilioService as NestTwilioService } from 'nestjs-twilio';

import { TwilioService } from './twilio.service';

describe('TwilioService', () => {
  let service: TwilioService;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config = {
        TWILIO_ACCOUNT_SID: 'test_account_sid',
        TWILIO_AUTH_TOKEN: 'test_auth_token',
        TWILIO_VERIFY_SERVICE_SID: 'test_verify_sid',
        TWILIO_PHONE_NUMBER: '+1234567890',
      };
      return config[key];
    }),
  };

  const mockNestTwilioService = {
    client: {
      messages: {
        create: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwilioService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: NestTwilioService,
          useValue: mockNestTwilioService,
        },
      ],
    }).compile();

    service = module.get<TwilioService>(TwilioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send SMS successfully', async () => {
    const message = 'Test message';
    const to = '+1987654321';

    await service.sendSMS(message, to);

    expect(mockNestTwilioService.client.messages.create).toHaveBeenCalledWith({
      body: message,
      from: '+1234567890',
      to,
    });
  });

  it('should throw BadRequestException when SMS sending fails', async () => {
    mockNestTwilioService.client.messages.create.mockRejectedValueOnce(
      new Error(),
    );

    await expect(service.sendSMS('Test', '+1987654321')).rejects.toThrow(
      'Failed to send SMS',
    );
  });
});
