import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { TokenService } from '../../common/token/token.service';
import { SessionService } from '../../common/session/session.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.tokenService.extractTokenFromRequest(request);
    if (!token) throw new UnauthorizedException('Access token is missing');

    const payload = this.tokenService.verifyToken(token);

    const deviceId = request.headers['x-device-id'] as string;
    if (!deviceId) throw new UnauthorizedException('Device ID is missing');

    const session = await this.sessionService.getSession(
      payload.sub.toString(),
      deviceId,
    );

    if (!session) throw new UnauthorizedException('Session not found');

    await this.sessionService.updateSession(payload.sub.toString(), deviceId, {
      lastActivity: new Date(),
    });

    return true;
  }
}
