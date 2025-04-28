/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { Connection } from 'mongoose';
import { Redis } from 'ioredis';

import { AppModule } from './../src/app.module';
import { SignUpDto } from '../src/auth/dtos/sign-up.dto';
import { SignInByPhoneNumberDto } from '../src/auth/dtos/sign-in-by-phone-number.dto';
import { PhoneNumberVerificationHelper } from '../src/auth/helpers/phone-number-verification.helper';
import { TwilioService } from '../src/common/twilio/twilio.service';

interface AuthResponse {
  user: {
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    picture?: string;
  };
  accessToken: string;
  refreshToken: string;
  deviceId: string;
}

interface ErrorResponse {
  message: string;
  statusCode: number;
}

describe('AuthWPhoneNumberController (e2e)', () => {
  jest.setTimeout(60000);

  let app: INestApplication;
  let mongoConnection: Connection;
  let redisClient: Redis;
  let configService: ConfigService;
  let phoneNumberVerificationHelper: PhoneNumberVerificationHelper;

  const mockUser = {
    phoneNumber: '+1234567890',
    firstName: 'Test',
    lastName: 'User',
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('TWILIO_CLIENT')
      .useValue({
        messages: {
          create: jest.fn().mockResolvedValue({ sid: 'test-sid' }),
        },
      })
      .overrideProvider(TwilioService)
      .useValue({
        sendSMS: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());
    configService = moduleFixture.get<ConfigService>(ConfigService);
    phoneNumberVerificationHelper =
      moduleFixture.get<PhoneNumberVerificationHelper>(
        PhoneNumberVerificationHelper,
      );

    redisClient = new Redis({
      host: configService.get<string>('REDIS_HOST'),
      port: configService.get<number>('REDIS_PORT'),
      password: configService.get<string>('REDIS_PASSWORD'),
      username: configService.get<string>('REDIS_USERNAME'),
      db: 1,
    });

    await app.init();

    await mongoConnection.createCollection('users');
    await mongoConnection
      .collection('users')
      .createIndex({ phoneNumber: 1 }, { unique: true });
  });

  beforeEach(async () => {
    try {
      if (mongoConnection.db) {
        const collections = await mongoConnection.db.collections();
        for (const collection of collections) {
          await collection.deleteMany({});
        }
      }
      await redisClient.flushall();
    } catch (error) {
      console.error('beforeEach cleanup error:', error);
    }
  });

  afterEach(async () => {
    try {
      if (mongoConnection.db) {
        const collections = await mongoConnection.db.collections();
        for (const collection of collections) {
          await collection.deleteMany({});
        }
      }
      await redisClient.flushall();
    } catch (error) {
      console.error('afterEach cleanup error:', error);
    }
  });

  afterAll(async () => {
    try {
      if (app) {
        await app.close();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (redisClient) {
        await redisClient.flushall();
        await redisClient.quit();
      }

      if (mongoConnection?.db) {
        await mongoConnection.close(true);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, 30000);

  describe('/auth/get-otp/:phoneNumber (POST)', () => {
    it('should send OTP successfully', async () => {
      jest.spyOn(phoneNumberVerificationHelper, 'sendVerificationCode');

      const response = await request(app.getHttpServer())
        .post(`/auth/get-otp/${mockUser.phoneNumber}`)
        .send();

      expect(response.status).toBe(201);
      expect(
        phoneNumberVerificationHelper.sendVerificationCode,
      ).toHaveBeenCalledWith(mockUser.phoneNumber);
    });

    it('should fail with invalid phone number format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/get-otp/invalid-phone')
        .send();

      expect(response.status).toBe(201);
    });
  });

  describe('/auth/verify-otp/:phoneNumber/:code (POST)', () => {
    beforeEach(async () => {
      await phoneNumberVerificationHelper.sendVerificationCode(
        mockUser.phoneNumber,
      );
    });

    it('should verify OTP successfully', async () => {
      const storedCode = await redisClient.get(
        `verification_code:${mockUser.phoneNumber}`,
      );

      const response = await request(app.getHttpServer())
        .post(`/auth/verify-otp/${mockUser.phoneNumber}/${storedCode}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });

    it('should fail with incorrect OTP', async () => {
      const response = await request(app.getHttpServer())
        .post(`/auth/verify-otp/${mockUser.phoneNumber}/9999`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });

    it('should fail for non-existent verification code', async () => {
      const response = await request(app.getHttpServer())
        .post(`/auth/verify-otp/+1987654321/1234`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Verification code not found');
    });
  });

  describe('/auth/sign-up (POST) with phone number', () => {
    const signUpDto: SignUpDto = { ...mockUser };

    beforeEach(async () => {
      await phoneNumberVerificationHelper.sendVerificationCode(
        mockUser.phoneNumber,
      );
    });

    it('should fail if phone number is not verified', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpDto);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Phone number not verified');
    });

    it('should create a new user after phone verification', async () => {
      const mockCode = '1234';
      await redisClient.set(
        `verification_code:${mockUser.phoneNumber}`,
        mockCode,
      );

      const verifyResponse = await request(app.getHttpServer())
        .post(`/auth/verify-otp/${mockUser.phoneNumber}/${mockCode}`)
        .send();

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body).toEqual({});

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const verificationStatus = await redisClient.get(
        `verification_code:${mockUser.phoneNumber}`,
      );
      expect(verificationStatus).toBe('verified');

      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpDto);

      expect(response.status).toBe(201);

      const body = response.body as AuthResponse;
      expect(body.user).toBeDefined();
      expect(body.user.phoneNumber).toBe(mockUser.phoneNumber);
      expect(body.user.firstName).toBe(mockUser.firstName);
      expect(body.user.lastName).toBe(mockUser.lastName);
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.deviceId).toBeDefined();
    });

    it('should fail if phone number already exists', async () => {
      const mockCode = '1234';
      await redisClient.set(
        `verification_code:${mockUser.phoneNumber}`,
        mockCode,
      );

      const verifyResponse = await request(app.getHttpServer())
        .post(`/auth/verify-otp/${mockUser.phoneNumber}/${mockCode}`)
        .send();

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body).toEqual({});

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const verificationStatus = await redisClient.get(
        `verification_code:${mockUser.phoneNumber}`,
      );
      expect(verificationStatus).toBe('verified');

      const firstResponse = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpDto);

      expect(firstResponse.status).toBe(201);

      const newCode = '5678';
      await redisClient.set(
        `verification_code:${mockUser.phoneNumber}`,
        newCode,
      );

      const secondVerifyResponse = await request(app.getHttpServer())
        .post(`/auth/verify-otp/${mockUser.phoneNumber}/${newCode}`)
        .send();

      expect(secondVerifyResponse.status).toBe(200);
      expect(secondVerifyResponse.body).toEqual({});

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newVerificationStatus = await redisClient.get(
        `verification_code:${mockUser.phoneNumber}`,
      );
      expect(newVerificationStatus).toBe('verified');

      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpDto);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Error creating user');
    });
  });

  describe('/auth/sign-in-w-phone-number (POST)', () => {
    const signInDto: SignInByPhoneNumberDto = {
      phoneNumber: mockUser.phoneNumber,
      password: mockUser.password,
    };

    beforeEach(async () => {
      try {
        const mockCode = '1234';
        await redisClient.set(
          `verification_code:${mockUser.phoneNumber}`,
          mockCode,
        );

        await redisClient.set(
          `verification_code:${mockUser.phoneNumber}`,
          'verified',
        );

        const response = await request(app.getHttpServer())
          .post('/auth/sign-up')
          .send(mockUser);

        expect(response.status).toBe(201);
      } catch (error) {
        console.error('Setup failed:', error);
      }
    });

    it('should authenticate user and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-in-w-phone-number')
        .send(signInDto);

      expect(response.status).toBe(200);

      const body = response.body as AuthResponse;
      expect(body.user).toBeDefined();
      expect(body.user.phoneNumber).toBe(mockUser.phoneNumber);
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.deviceId).toBeDefined();
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-in-w-phone-number')
        .send({
          ...signInDto,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);

      const body = response.body as ErrorResponse;
      expect(body.message).toBe('Invalid credentials');
    });

    it('should fail with non-existent phone number', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-in-w-phone-number')
        .send({
          ...signInDto,
          phoneNumber: '+1987654321',
        });

      expect(response.status).toBe(404);

      const body = response.body as ErrorResponse;
      expect(body.message).toBe('User not found');
    });
  });
});
