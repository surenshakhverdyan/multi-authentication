import { Injectable } from '@nestjs/common';

import * as bcrypt from 'bcrypt';

@Injectable()
export class CryptoService {
  private saltRounds = 10;
  private salt: string;

  async hashPassword(password: string): Promise<string> {
    this.salt = await bcrypt.genSalt(this.saltRounds);
    return await bcrypt.hash(password, this.salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
