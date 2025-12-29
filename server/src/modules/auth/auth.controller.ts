import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AppleAuthDto } from './dto/apple-auth.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { clearAuthCookie } from '../../common/utils/auth-cookie.util';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user with email and password' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const userData = await this.authService.register(registerDto);
    const user = await this.authService.getCurrentUser(userData.userId);
    const authData = await this.authService.generateTokenAndSetCookie(
      { ...user },
      res,
    );

    return res.json({ ...userData, token: authData.token });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    return res.json(await this.authService.login(loginDto, res));
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth authentication' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated with Google',
  })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    interface GoogleProfile {
      googleId: string;
      email: string;
      fullName: string;
      avatar?: string;
    }
    const profile = req.user as GoogleProfile;
    const authData = await this.authService.handleGoogleAuth(profile, res);

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    let redirectUrl = `${frontendUrl}/auth/callback?success=true`;
    if (isProduction && 'token' in authData && authData.token) {
      redirectUrl = `${frontendUrl}/auth/callback?success=true&token=${encodeURIComponent(authData.token)}`;
    }

    return res.redirect(redirectUrl);
  }

  @Public()
  @Post('apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with Apple Sign In' })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated with Apple',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Apple authentication failed' })
  async appleAuth(@Body() appleAuthDto: AppleAuthDto, @Res() res: Response) {
    return res.json(
      await this.authService.handleAppleAuth(
        appleAuthDto.identityToken,
        appleAuthDto.fullName,
        res,
      ),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  logout(@Res() res: Response) {
    clearAuthCookie(res, this.configService);
    return res.json({ message: 'Successfully logged out' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: JwtUser) {
    return await this.authService.getCurrentUser(user.userId);
  }
}
