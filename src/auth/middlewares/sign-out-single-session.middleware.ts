import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { TokenService } from 'src/common/token/token.service';

@Injectable()
export class SignOutSingleSessionMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const token = this.tokenService.extractTokenFromRequest(req);
    const deviceId = req.headers['x-device-id'];

    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    if (!deviceId) {
      throw new BadRequestException('Device ID is missing');
    }

    const payload = this.tokenService.verifyToken(token);

    req.body = { userId: payload.sub, deviceId };

    next();
  }
}
