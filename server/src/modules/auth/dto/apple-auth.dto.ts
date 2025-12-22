import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppleAuthDto {
  @ApiProperty({
    description: 'Apple identity token',
    example: 'eyJraWQiOiJlWGF1bm1...',
  })
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  @ApiProperty({
    description: 'User full name (optional, provided by Apple)',
    required: false,
  })
  fullName?: string;
}
