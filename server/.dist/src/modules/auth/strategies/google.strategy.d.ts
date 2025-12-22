import { ConfigService } from '@nestjs/config';
import { VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
interface GoogleProfile {
    id: string;
    name: {
        givenName: string;
        familyName: string;
    };
    emails: Array<{
        value: string;
    }>;
    photos?: Array<{
        value: string;
    }>;
}
interface GoogleUser {
    googleId: string;
    email: string;
    fullName: string;
    avatar: string;
}
declare const GoogleStrategy_base: new (...args: any) => any;
export declare class GoogleStrategy extends GoogleStrategy_base {
    private configService;
    private authService;
    constructor(configService: ConfigService, authService: AuthService);
    validate(accessToken: string, refreshToken: string, profile: GoogleProfile, done: VerifyCallback<GoogleUser>): void;
}
export {};
