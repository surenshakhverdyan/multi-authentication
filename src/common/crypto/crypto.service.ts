import { Injectable } from '@nestjs/common';

import * as bcrypt from 'bcrypt';

@Injectable()
export class CryptoService {
  private saltRounds = 10;
  private salt: string;

  constructor() {
    this.salt = bcrypt.genSaltSync(this.saltRounds);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
