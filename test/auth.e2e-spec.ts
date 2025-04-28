/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
import { SignInDto } from '../src/auth/dtos/sign-in.dto';

interface AuthResponse {
  user: {
    email: string;
    firstName: string;
    lastName: string;
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

describe('AuthController (e2e)', () => {
  jest.setTimeout(60000);

  let app: INestApplication;
  let mongoConnection: Connection;
  let redisClient: Redis;
  let configService: ConfigService;

  const mockUser = {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());
    configService = moduleFixture.get<ConfigService>(ConfigService);

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
      .createIndex({ email: 1 }, { unique: true });
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

  describe('/auth/sign-up (POST)', () => {
    const signUpDto: SignUpDto = { ...mockUser };

    it('should create a new user and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpDto);

      expect(response.status).toBe(201);

      const body = response.body as AuthResponse;
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe(mockUser.email);
      expect(body.user.firstName).toBe(mockUser.firstName);
      expect(body.user.lastName).toBe(mockUser.lastName);
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.deviceId).toBeDefined();
    });

    it('should fail if email already exists', async () => {
      const firstResponse = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpDto);

      expect(firstResponse.status).toBe(201);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpDto);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email already exists');
    });

    it('should fail with invalid data', async () => {
      const invalidDto = {
        email: 'invalid-email',
        password: '123',
        firstName: '',
        lastName: '',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(invalidDto);

      expect(response.status).toBe(400);
    });
  });

  describe('/auth/sign-in (POST)', () => {
    const signInDto: SignInDto = {
      email: mockUser.email,
      password: mockUser.password,
    };

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(mockUser);

      expect(response.status).toBe(201);
    });

    it('should authenticate user and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send(signInDto);

      expect(response.status).toBe(200);

      const body = response.body as AuthResponse;
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe(mockUser.email);
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.deviceId).toBeDefined();
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ ...signInDto, password: 'wrongpassword' });

      expect(response.status).toBe(401);

      const body = response.body as ErrorResponse;
      expect(body.message).toBe('Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          ...signInDto,
          email: 'nonexistent@example.com',
        });

      expect(response.status).toBe(404);

      const body = response.body as ErrorResponse;
      expect(body.message).toBe('User not found');
    });
  });

  describe('/auth/refresh-token (POST)', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(mockUser);

      expect(response.status).toBe(201);
      const body = response.body as AuthResponse;
      refreshToken = body.refreshToken;
    });

    it('should return new access token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .set('x-refresh-token', refreshToken);

      expect(response.status).toBe(200);

      const body = response.body as { accessToken: string };
      expect(body.accessToken).toBeDefined();
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh-token')
        .set('x-refresh-token', 'invalid-token');

      expect(response.status).toBe(401);
    });

    it('should fail without refresh token', async () => {
      const response = await request(app.getHttpServer()).post(
        '/auth/refresh-token',
      );

      expect(response.status).toBe(401);

      const body = response.body as ErrorResponse;
      expect(body.message).toBe('Refresh token is missing');
    });
  });

  describe('Authenticated routes', () => {
    let accessToken: string;
    let deviceId: string;
    let userId: string;

    beforeEach(async () => {
      const signUpResponse = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(mockUser);

      expect(signUpResponse.status).toBe(201);

      const body = signUpResponse.body as AuthResponse;
      accessToken = body.accessToken;
      deviceId = body.deviceId;

      const base64Payload = accessToken.split('.')[1];
      const decodedPayload = Buffer.from(base64Payload, 'base64').toString();
      const payload = JSON.parse(decodedPayload) as { sub: string };
      userId = payload.sub;

      const session = await redisClient.hgetall(
        `session:${userId}:${deviceId}`,
      );
      expect(session).toBeDefined();
    });

    describe('/auth/sign-out (POST)', () => {
      it('should successfully sign out from current device', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/sign-out')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('x-device-id', deviceId);

        expect(response.status).toBe(200);

        const session = await redisClient.hgetall(
          `session:${userId}:${deviceId}`,
        );
        expect(Object.keys(session)).toHaveLength(0);
      });

      it('should fail without authorization header', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/sign-out')
          .set('x-device-id', deviceId);

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Token is missing');
      });

      it('should fail without device-id header', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/sign-out')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Device ID is missing');

        const session = await redisClient.hgetall(
          `session:${userId}:${deviceId}`,
        );
        expect(session).toBeDefined();
      });

      it('should fail with invalid token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/sign-out')
          .set('Authorization', 'Bearer invalid.token.here')
          .set('x-device-id', deviceId);

        expect(response.status).toBe(401);
      });

      it('should fail with invalid device ID', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/sign-out')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('x-device-id', 'invalid-device-id');

        expect(response.status).toBe(200);

        const session = await redisClient.hgetall(
          `session:${userId}:${deviceId}`,
        );
        expect(session).toBeDefined();
      });
    });

    describe('/auth/sign-out-all (POST)', () => {
      it('should successfully sign out from all devices', async () => {
        const secondSignInResponse = await request(app.getHttpServer())
          .post('/auth/sign-in')
          .send({
            email: mockUser.email,
            password: mockUser.password,
          });

        const secondSession = secondSignInResponse.body as AuthResponse;
        expect(secondSession.deviceId).not.toBe(deviceId);

        const firstSession = await redisClient.hgetall(
          `session:${userId}:${deviceId}`,
        );
        const secondSessionData = await redisClient.hgetall(
          `session:${userId}:${secondSession.deviceId}`,
        );
        expect(firstSession).toBeDefined();
        expect(secondSessionData).toBeDefined();

        const response = await request(app.getHttpServer())
          .post('/auth/sign-out-all')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);

        const sessions = await redisClient.keys(`session:${userId}:*`);
        expect(sessions).toHaveLength(0);
      });

      it('should fail without authorization header', async () => {
        const response = await request(app.getHttpServer()).post(
          '/auth/sign-out-all',
        );

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Token not found');

        const session = await redisClient.hgetall(
          `session:${userId}:${deviceId}`,
        );
        expect(session).toBeDefined();
      });

      it('should fail with invalid token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/sign-out-all')
          .set('Authorization', 'Bearer invalid.token.here');

        expect(response.status).toBe(401);

        const session = await redisClient.hgetall(
          `session:${userId}:${deviceId}`,
        );
        expect(session).toBeDefined();
      });
    });
  });
});
