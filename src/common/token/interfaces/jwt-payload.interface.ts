import { Types } from 'mongoose';

export interface JwtPayload {
  sub: Types.ObjectId | string;
  exp?: number;
  iat?: number;
}
