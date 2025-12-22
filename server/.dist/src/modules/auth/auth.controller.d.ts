import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AppleAuthDto } from './dto/apple-auth.dto';
import type { JwtUser } from '../../common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';
export declare class AuthController {
    private readonly authService;
    private readonly configService;
    constructor(authService: AuthService, configService: ConfigService);
    register(registerDto: RegisterDto, res: Response): Promise<Response<any, Record<string, any>>>;
    login(loginDto: LoginDto, res: Response): Promise<Response<any, Record<string, any>>>;
    googleAuth(): Promise<void>;
    googleAuthCallback(req: Request, res: Response): Promise<void>;
    appleAuth(appleAuthDto: AppleAuthDto, res: Response): Promise<Response<any, Record<string, any>>>;
    logout(res: Response): Response<any, Record<string, any>>;
    getProfile(user: JwtUser): Promise<any>;
}
