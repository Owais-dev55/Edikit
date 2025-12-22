import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtUser } from '../../common/decorators/current-user.decorator';
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
export declare class AuthService {
    private readonly prisma;
    private readonly userService;
    private readonly jwtService;
    private readonly configService;
    constructor(prisma: PrismaService, userService: UserService, jwtService: JwtService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<{
        userId: string;
        email: string;
        fullName: string;
        role: string;
        planType: string;
    }>;
    login(loginDto: LoginDto, res: Response): Promise<{
        userId: string;
        email: string;
        fullName: string;
        role: string;
        planType: string;
    }>;
    validateLocalUser(email: string, password: string): Promise<UserForToken>;
    validateJwtUser(userId: string): Promise<JwtUser>;
    generateToken(userId: string): Promise<string>;
    generateTokenAndSetCookie(user: UserForToken, res: Response): Promise<{
        userId: string;
        email: string;
        fullName: string;
        role: string;
        planType: string;
    }>;
    handleGoogleAuth(profile: GoogleProfile, res: Response): Promise<{
        userId: string;
        email: string;
        fullName: string;
        role: string;
        planType: string;
    }>;
    handleAppleAuth(identityToken: string, fullName?: string, res?: Response): Promise<{
        userId: string;
        email: string;
        fullName: string;
        role: string;
        planType: string;
    }>;
    getCurrentUser(userId: string): Promise<any>;
}
export {};
