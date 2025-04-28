import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignOutDto {
  @ApiProperty({
    description: 'User ID extracted from the token payload',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Device ID extracted from the request headers',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
