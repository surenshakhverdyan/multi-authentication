import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { JwtPayload } from 'src/common/token/interfaces/jwt-payload.interface';
import { TokenService } from 'src/common/token/token.service';

@Injectable()
export class RefreshTokenMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const refreshToken = req.headers['x-refresh-token'];
    if (!refreshToken)
      throw new UnauthorizedException('Refresh token is missing');

    const payload: JwtPayload = this.tokenService.verifyToken(
      refreshToken as string,
    );
    if (!payload) throw new UnauthorizedException('Invalid refresh token');

    delete payload.iat;
    delete payload.exp;

    req.body = payload;

    next();
  }
}
