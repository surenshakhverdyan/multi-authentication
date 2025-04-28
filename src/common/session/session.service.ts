import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';

import { ISession } from './interfaces/session.interface';

@Injectable()
export class SessionService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly sessionTTL: number;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      username: this.configService.get<string>('REDIS_USERNAME'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });

    this.sessionTTL = this.configService.get<number>('SESSION_TTL')!;
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  private getSessionKey(userId: string, deviceId: string): string {
    return `session:${userId}:${deviceId}`;
  }

  private getAllUserSessionsPattern(userId: string): string {
    return `session:${userId}:*`;
  }

  async createVerificationCode(
    phoneNumber: string,
    code: string,
  ): Promise<void> {
    try {
      const key = `verification_code:${phoneNumber}`;
      await this.redis.set(key, code);
      await this.redis.expire(key, 300);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create verification code: ${message}`);
    }
  }

  async changeVerificationCode(phoneNumber: string): Promise<void> {
    try {
      const key = `verification_code:${phoneNumber}`;
      await this.redis.set(key, 'verified');
      await this.redis.expire(key, 600);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to change verification code: ${message}`);
    }
  }

  async getVerificationCode(phoneNumber: string): Promise<string | null> {
    try {
      const key = `verification_code:${phoneNumber}`;
      const code = await this.redis.get(key);
      return code;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get verification code: ${message}`);
    }
  }

  async createSession(session: Omit<ISession, 'deviceId'>): Promise<ISession> {
    const deviceId = crypto.randomUUID();
    const fullSession: ISession = {
      ...session,
      deviceId,
      lastActivity: new Date(),
    };

    try {
      const key = this.getSessionKey(
        session.userId.toString(),
        fullSession.deviceId,
      );

      await this.redis.hmset(key, {
        ...fullSession,
        lastActivity: fullSession.lastActivity.toISOString(),
      });
      await this.redis.expire(key, this.sessionTTL);

      return fullSession;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create session: ${message}`);
    }
  }

  async getSession(userId: string, deviceId: string): Promise<ISession | null> {
    try {
      const key = this.getSessionKey(userId, deviceId);
      const session = await this.redis.hgetall(key);

      if (!Object.keys(session).length) {
        return null;
      }

      return {
        ...session,
        lastActivity: new Date(session.lastActivity),
      } as ISession;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get session: ${message}`);
    }
  }

  async updateSession(
    userId: string,
    deviceId: string,
    updates: Partial<ISession>,
  ): Promise<void> {
    try {
      const key = this.getSessionKey(userId, deviceId);
      await this.redis.hmset(key, {
        ...updates,
        lastActivity: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update session: ${message}`);
    }
  }

  async removeSession(userId: string, deviceId: string): Promise<void> {
    try {
      const key = this.getSessionKey(userId, deviceId);
      await this.redis.del(key);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to remove session: ${message}`);
    }
  }

  async removeAllSessions(userId: string): Promise<void> {
    try {
      const pattern = this.getAllUserSessionsPattern(userId);
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to remove all sessions: ${message}`);
    }
  }

  async getAllUserSessions(userId: string): Promise<ISession[]> {
    try {
      const pattern = this.getAllUserSessionsPattern(userId);
      const keys = await this.redis.keys(pattern);
      const sessions: ISession[] = [];

      for (const key of keys) {
        const session = await this.redis.hgetall(key);
        if (Object.keys(session).length) {
          sessions.push({
            ...session,
            lastActivity: new Date(session.lastActivity),
          } as ISession);
        }
      }

      return sessions;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get all sessions: ${message}`);
    }
  }
}
