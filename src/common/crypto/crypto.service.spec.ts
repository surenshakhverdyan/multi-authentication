import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;
  const testPassword = 'test-password-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const hashedPassword = await service.hashPassword(testPassword);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toEqual(testPassword);
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should generate unique hashes', async () => {
      const hash1 = await service.hashPassword(testPassword);
      const hash2 = await service.hashPassword(testPassword);

      expect(hash1).not.toEqual(hash2);

      expect(await bcrypt.compare(testPassword, hash1)).toBe(true);
      expect(await bcrypt.compare(testPassword, hash2)).toBe(true);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const hashedPassword = await service.hashPassword(testPassword);
      const isMatch = await service.comparePassword(
        testPassword,
        hashedPassword,
      );

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const hashedPassword = await service.hashPassword(testPassword);
      const isMatch = await service.comparePassword(
        'wrong-password',
        hashedPassword,
      );

      expect(isMatch).toBe(false);
    });
  });
});
