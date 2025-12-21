import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'SecurePassword123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
