import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { parseJwtExpiresIn } from './parse-jwt-expires-in.util';

function getCookieOptions(configService: ConfigService, maxAge?: number) {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const tokenName = configService.get<string>('JWT_TOKEN_NAME', 'user_token');

  const baseOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
    ...(maxAge && { maxAge }),
  };

  return { tokenName, options: baseOptions };
}

export function setAuthCookie(
  res: Response,
  token: string,
  configService: ConfigService,
) {
  const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '7d');
  const maxAge = parseJwtExpiresIn(expiresIn);
  const { tokenName, options } = getCookieOptions(configService, maxAge);

  res.cookie(tokenName, token, options);
}

export function clearAuthCookie(res: Response, configService: ConfigService) {
  const { tokenName, options } = getCookieOptions(configService);
  res.clearCookie(tokenName, options);
}
