import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MongoServerError } from 'mongodb';
import { Model } from 'mongoose';

import { SignUpDto } from 'src/auth/dtos/sign-up.dto';
import { User } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(dto: SignUpDto): Promise<User> {
    try {
      return await this.userModel.create(dto);
    } catch (error: unknown) {
      if ((error as MongoServerError).code === 11000) {
        throw new BadRequestException('Email already exists');
      }
      throw new BadRequestException('Error creating user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ email });
  }

  async findByProviderId(
    providerId: string,
    provider: string,
  ): Promise<User | null> {
    return await this.userModel.findOne({ providerId, provider });
  }
}
