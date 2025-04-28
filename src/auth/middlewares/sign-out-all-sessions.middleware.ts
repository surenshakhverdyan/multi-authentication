import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { TokenService } from 'src/common/token/token.service';

@Injectable()
export class SignOutAllSessionsMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const token = this.tokenService.extractTokenFromRequest(req);
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    const payload = this.tokenService.verifyToken(token);

    req.body = { userId: payload.sub };

    next();
  }
}
