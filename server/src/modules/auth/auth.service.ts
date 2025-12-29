import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { hash, verify } from 'argon2';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { setAuthCookie } from '../../common/utils/auth-cookie.util';
import { JwtUser } from '../../common/decorators/current-user.decorator';
import { Role, PlanType } from '@generated/prisma/client';
import AppleSignIn from 'apple-signin-auth';

interface GoogleProfile {
  googleId: string;
  email: string;
  fullName: string;
  avatar?: string;
}

interface UserForToken {
  id?: string;
  userId?: string;
  email: string;
  fullName: string;
  role: string;
  planType: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    userId: string;
    email: string;
    fullName: string;
    role: string;
    planType: string;
  }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await hash(registerDto.password);

    const firstUser = await this.prisma.user.findFirst({
      select: { id: true },
    });

    const role = firstUser ? Role.USER : Role.ADMIN;

    const user = await this.prisma.user.create({
      data: {
        fullName: registerDto.fullName,
        email: registerDto.email,
        password: hashedPassword,
        role,
        planType: PlanType.FREE,
        provider: 'email',
      },
    });

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      planType: user.planType,
    };
  }

  async login(
    loginDto: LoginDto,
    res: Response,
  ): Promise<{
    userId: string;
    email: string;
    fullName: string;
    role: string;
    planType: string;
  }> {
    const user = await this.validateLocalUser(
      loginDto.email,
      loginDto.password,
    );
    return this.generateTokenAndSetCookie(user, res);
  }

  async validateLocalUser(
    email: string,
    password: string,
  ): Promise<UserForToken> {
    try {
      const user = await this.userService.findUserByEmail(email);

      if (!user.password) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const passwordMatched = await verify(user.password, password);
      if (!passwordMatched) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        planType: user.planType,
      };
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async validateJwtUser(userId: string): Promise<JwtUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    return {
      userId: user.id,
      role: user.role,
    };
  }

  async generateToken(userId: string): Promise<string> {
    const payload = {
      sub: {
        userId,
      },
    };
    return await this.jwtService.signAsync(payload);
  }

  async generateTokenAndSetCookie(
    user: UserForToken,
    res: Response,
  ): Promise<{
    userId: string;
    email: string;
    fullName: string;
    role: string;
    planType: string;
    token?: string;
  }> {
    const userId = (user.id || user.userId) as string;
    const token = await this.generateToken(userId);
    setAuthCookie(res, token, this.configService);

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    return {
      userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      planType: user.planType,
      // Include token in response for Safari/iOS fallback (when cookies are blocked)
      // Only in production where cross-domain cookies may be blocked
      ...(isProduction && { token }),
    };
  }

  async handleGoogleAuth(
    profile: GoogleProfile,
    res: Response,
  ): Promise<{
    userId: string;
    email: string;
    fullName: string;
    role: string;
    planType: string;
    token?: string;
  }> {
    let user = await this.userService.findUserByGoogleId(profile.googleId);

    if (!user) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            googleId: profile.googleId,
            provider: existingUser.provider === 'email' ? 'email' : 'google',
            avatar: profile.avatar || existingUser.avatar,
          },
        });
      } else {
        const firstUser = await this.prisma.user.findFirst({
          select: { id: true },
        });

        const role = firstUser ? Role.USER : Role.ADMIN;

        user = await this.prisma.user.create({
          data: {
            fullName: profile.fullName,
            email: profile.email,
            googleId: profile.googleId,
            provider: 'google',
            role,
            planType: PlanType.FREE,
            avatar: profile.avatar || '',
          },
        });
      }
    }

    return this.generateTokenAndSetCookie(user, res);
  }

  async handleAppleAuth(
    identityToken: string,
    fullName?: string,
    res?: Response,
  ): Promise<{
    userId: string;
    email: string;
    fullName: string;
    role: string;
    planType: string;
  }> {
    try {
      const clientId = this.configService.get<string>('APPLE_CLIENT_ID');

      const appleUser = await AppleSignIn.verifyIdToken(identityToken, {
        audience: clientId,
      });

      const appleId = appleUser.sub;
      const email = appleUser.email;

      if (!email) {
        throw new UnauthorizedException('Email not provided by Apple');
      }

      let user = await this.userService.findUserByAppleId(appleId);

      if (!user) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          user = await this.prisma.user.update({
            where: { id: existingUser.id },
            data: {
              appleId,
              provider: existingUser.provider === 'email' ? 'email' : 'apple',
            },
          });
        } else {
          const firstUser = await this.prisma.user.findFirst({
            select: { id: true },
          });

          const role = firstUser ? Role.USER : Role.ADMIN;

          user = await this.prisma.user.create({
            data: {
              fullName: fullName || 'Apple User',
              email,
              appleId,
              provider: 'apple',
              role,
              planType: PlanType.FREE,
            },
          });
        }
      }

      if (res) {
        return this.generateTokenAndSetCookie(user, res);
      }

      return {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        planType: user.planType,
      };
    } catch {
      throw new UnauthorizedException('Apple authentication failed');
    }
  }

  async getCurrentUser(userId: string) {
    return await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        planType: true,
        avatar: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
