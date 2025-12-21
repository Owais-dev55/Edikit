import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User full name' })
  fullName: string;

  @ApiProperty({ description: 'User role', enum: ['USER', 'ADMIN'] })
  role: string;

  @ApiProperty({
    description: 'User plan type',
    enum: ['FREE', 'BASIC', 'PRO'],
  })
  planType: string;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User full name' })
  fullName: string;

  @ApiProperty({ description: 'User role', enum: ['USER', 'ADMIN'] })
  role: string;

  @ApiProperty({
    description: 'User plan type',
    enum: ['FREE', 'BASIC', 'PRO'],
  })
  planType: string;

  @ApiProperty({ description: 'User avatar URL', required: false })
  avatar?: string;

  @ApiProperty({
    description: 'Authentication provider',
    enum: ['email', 'google', 'apple'],
  })
  provider: string;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}
