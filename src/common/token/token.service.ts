import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
  }

  verifyToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error: unknown) {
      if (error instanceof Error)
        throw new UnauthorizedException(error.message);

      throw new UnauthorizedException('Invalid token');
    }
  }

  extractTokenFromRequest(req: Request): string | null {
    const [bearer, token] = req.headers.authorization?.split(' ') ?? [];
    return bearer === 'Bearer' ? token : null;
  }
}
