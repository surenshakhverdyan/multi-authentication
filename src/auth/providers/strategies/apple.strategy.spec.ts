import { Test, TestingModule } from '@nestjs/testing';

import { AppleStrategy } from './apple.strategy';

describe('AppleStrategy', () => {
  let provider: AppleStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppleStrategy],
    }).compile();

    provider = module.get<AppleStrategy>(AppleStrategy);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
