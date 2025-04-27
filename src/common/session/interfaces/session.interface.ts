import { Types } from 'mongoose';

export interface ISession {
  userId: Types.ObjectId | string;
  deviceId: string;
  ip: string;
  userAgent: string;
  lastActivity: Date;
}
