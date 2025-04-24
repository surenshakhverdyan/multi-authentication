import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MongoServerError } from 'mongodb';

import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { SignUpDto } from 'src/auth/dtos/sign-up.dto';

describe('UserService', () => {
  let service: UserService;

  const mockUser = {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'password123',
  };

  const mockUserModel = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: SignUpDto = {
      email: mockUser.email,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      password: mockUser.password,
    };

    it('should successfully create a user', async () => {
      mockUserModel.create.mockResolvedValueOnce(mockUser);

      const result = await service.create(createDto);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.create).toHaveBeenCalledWith(createDto);
      expect(mockUserModel.create).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when email already exists', async () => {
      const duplicateError = new MongoServerError({
        message: 'duplicate key error',
        code: 11000,
      });
      mockUserModel.create.mockRejectedValueOnce(duplicateError);

      await expect(service.create(createDto)).rejects.toThrow(
        new BadRequestException('Email already exists'),
      );
      expect(mockUserModel.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw BadRequestException for other database errors', async () => {
      const error = new Error('Database error');
      mockUserModel.create.mockRejectedValueOnce(error);

      await expect(service.create(createDto)).rejects.toThrow(
        new BadRequestException('Error creating user'),
      );
      expect(mockUserModel.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      mockUserModel.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: mockUser.email,
      });
      expect(mockUserModel.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return null when user is not found', async () => {
      mockUserModel.findOne.mockResolvedValueOnce(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'nonexistent@example.com',
      });
    });
  });

  describe('findByProviderId', () => {
    const providerId = 'google123';
    const provider = 'google';

    it('should find a user by provider ID and provider', async () => {
      mockUserModel.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.findByProviderId(providerId, provider);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        providerId,
        provider,
      });
      expect(mockUserModel.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return null when user is not found', async () => {
      mockUserModel.findOne.mockResolvedValueOnce(null);

      const result = await service.findByProviderId('nonexistent', 'google');

      expect(result).toBeNull();
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        providerId: 'nonexistent',
        provider: 'google',
      });
    });
  });
});
