import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { JwtUser } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const tokenName = configService.get<string>(
            'JWT_TOKEN_NAME',
            'auth_token',
          );
          const token = req?.cookies?.[tokenName] as string | undefined;
          return token || null;
        },
      ]),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: { userId: string } }): Promise<JwtUser> {
    const { userId } = payload.sub;
    const jwtUser: JwtUser = await this.authService.validateJwtUser(userId);
    return jwtUser;
  }
}
