/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { Types } from 'mongoose';

import { SessionService } from './session.service';
import { ISession } from './interfaces/session.interface';

class RedisMock {
  hmset = jest.fn();
  hgetall = jest.fn();
  expire = jest.fn();
  del = jest.fn();
  keys = jest.fn();
  quit = jest.fn();
}

const redisMock = new RedisMock();

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => redisMock),
  };
});

describe('SessionService', () => {
  let service: SessionService;
  let redis: RedisMock;
  let configService: jest.Mocked<ConfigService>;

  const mockUserId = new Types.ObjectId().toString();
  const mockDeviceId = 'test-device-id';
  const mockSession: ISession = {
    userId: mockUserId,
    deviceId: mockDeviceId,
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    lastActivity: new Date(),
  };

  const sessionToRedisFormat = (session: ISession): Record<string, string> => ({
    userId: session.userId.toString(),
    deviceId: session.deviceId,
    ip: session.ip,
    userAgent: session.userAgent,
    lastActivity: session.lastActivity.toISOString(),
  });

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        REDIS_USERNAME: 'test',
        REDIS_PASSWORD: 'test',
        SESSION_TTL: 3600,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Redis,
          useValue: redisMock,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    redis = module.get(Redis);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize Redis with correct config', () => {
      expect(Redis).toHaveBeenCalledWith({
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        username: configService.get('REDIS_USERNAME'),
        password: configService.get('REDIS_PASSWORD'),
      });
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const sessionData: Omit<ISession, 'deviceId'> = {
        userId: mockSession.userId,
        ip: mockSession.ip,
        userAgent: mockSession.userAgent,
        lastActivity: mockSession.lastActivity,
      };

      redis.hmset.mockResolvedValueOnce('OK');
      redis.expire.mockResolvedValueOnce(1);

      const result = await service.createSession(sessionData);

      expect(result.deviceId).toBeDefined();
      expect(redis.hmset).toHaveBeenCalled();
      expect(redis.expire).toHaveBeenCalled();
      expect(result.userId).toBe(sessionData.userId);
      expect(result.ip).toBe(sessionData.ip);
      expect(result.userAgent).toBe(sessionData.userAgent);
    });

    it('should throw error when Redis operation fails', async () => {
      const sessionData: Omit<ISession, 'deviceId'> = {
        userId: mockSession.userId,
        ip: mockSession.ip,
        userAgent: mockSession.userAgent,
        lastActivity: mockSession.lastActivity,
      };

      redis.hmset.mockRejectedValueOnce(new Error('Redis error'));

      await expect(service.createSession(sessionData)).rejects.toThrow(
        'Failed to create session',
      );
    });
  });

  describe('getSession', () => {
    it('should return session if exists', async () => {
      redis.hgetall.mockResolvedValueOnce(sessionToRedisFormat(mockSession));

      const result = await service.getSession(mockUserId, mockDeviceId);

      expect(result).toBeDefined();
      expect(result!.userId.toString()).toBe(mockSession.userId.toString());
      expect(result!.deviceId).toBe(mockSession.deviceId);
      expect(redis.hgetall).toHaveBeenCalled();
    });

    it('should return null if session does not exist', async () => {
      redis.hgetall.mockResolvedValueOnce({});

      const result = await service.getSession(mockUserId, mockDeviceId);

      expect(result).toBeNull();
      expect(redis.hgetall).toHaveBeenCalled();
    });

    it('should throw error when Redis operation fails', async () => {
      redis.hgetall.mockRejectedValueOnce(new Error('Redis error'));

      await expect(
        service.getSession(mockUserId, mockDeviceId),
      ).rejects.toThrow('Failed to get session');
    });
  });

  describe('updateSession', () => {
    it('should update session successfully', async () => {
      const updates = { lastActivity: new Date() };
      redis.hmset.mockResolvedValueOnce('OK');

      await service.updateSession(mockUserId, mockDeviceId, updates);

      expect(redis.hmset).toHaveBeenCalled();
    });

    it('should throw error when Redis operation fails', async () => {
      const updates = { lastActivity: new Date() };
      redis.hmset.mockRejectedValueOnce(new Error('Redis error'));

      await expect(
        service.updateSession(mockUserId, mockDeviceId, updates),
      ).rejects.toThrow('Failed to update session');
    });
  });

  describe('removeSession', () => {
    it('should remove session successfully', async () => {
      redis.del.mockResolvedValueOnce(1);

      await service.removeSession(mockUserId, mockDeviceId);

      expect(redis.del).toHaveBeenCalled();
    });

    it('should throw error when Redis operation fails', async () => {
      redis.del.mockRejectedValueOnce(new Error('Redis error'));

      await expect(
        service.removeSession(mockUserId, mockDeviceId),
      ).rejects.toThrow('Failed to remove session');
    });
  });

  describe('removeAllSessions', () => {
    it('should remove all sessions for a user', async () => {
      redis.keys.mockResolvedValueOnce(['session1', 'session2']);
      redis.del.mockResolvedValueOnce(2);

      await service.removeAllSessions(mockUserId);

      expect(redis.keys).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
    });

    it('should not call del if no sessions exist', async () => {
      redis.keys.mockResolvedValueOnce([]);

      await service.removeAllSessions(mockUserId);

      expect(redis.keys).toHaveBeenCalled();
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should throw error when Redis operation fails', async () => {
      redis.keys.mockRejectedValueOnce(new Error('Redis error'));

      await expect(service.removeAllSessions(mockUserId)).rejects.toThrow(
        'Failed to remove all sessions',
      );
    });
  });

  describe('getAllUserSessions', () => {
    it('should return all sessions for a user', async () => {
      redis.keys.mockResolvedValueOnce(['session1', 'session2']);
      redis.hgetall
        .mockResolvedValueOnce(sessionToRedisFormat(mockSession))
        .mockResolvedValueOnce(sessionToRedisFormat(mockSession));

      const result = await service.getAllUserSessions(mockUserId);

      expect(result).toHaveLength(2);
      expect(redis.keys).toHaveBeenCalled();
      expect(redis.hgetall).toHaveBeenCalledTimes(2);
    });

    it('should return empty array if no sessions exist', async () => {
      redis.keys.mockResolvedValueOnce([]);

      const result = await service.getAllUserSessions(mockUserId);

      expect(result).toHaveLength(0);
      expect(redis.keys).toHaveBeenCalled();
      expect(redis.hgetall).not.toHaveBeenCalled();
    });

    it('should throw error when Redis operation fails', async () => {
      redis.keys.mockRejectedValueOnce(new Error('Redis error'));

      await expect(service.getAllUserSessions(mockUserId)).rejects.toThrow(
        'Failed to get all sessions',
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit Redis connection', async () => {
      redis.quit.mockResolvedValueOnce('OK');

      await service.onModuleDestroy();

      expect(redis.quit).toHaveBeenCalled();
    });
  });
});
