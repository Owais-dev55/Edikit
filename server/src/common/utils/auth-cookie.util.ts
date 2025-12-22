import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { parseJwtExpiresIn } from './parse-jwt-expires-in.util';

export function setAuthCookie(
  res: Response,
  token: string,
  configService: ConfigService,
) {
  const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '7d');
  const maxAge = parseJwtExpiresIn(expiresIn);

  res.cookie(configService.get<string>('JWT_TOKEN_NAME', 'user_token'), token, {
    httpOnly: true,
    secure: configService.get<string>('NODE_ENV') === 'production',
    sameSite: 'none',
    maxAge,
  });
}

export function clearAuthCookie(res: Response, configService: ConfigService) {
  res.clearCookie(configService.get<string>('JWT_TOKEN_NAME', 'user_token'), {
    httpOnly: true,
    secure: configService.get<string>('NODE_ENV') === 'production',
    sameSite: 'none',
  });
}
