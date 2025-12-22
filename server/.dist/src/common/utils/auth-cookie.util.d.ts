import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
export declare function setAuthCookie(res: Response, token: string, configService: ConfigService): void;
export declare function clearAuthCookie(res: Response, configService: ConfigService): void;
