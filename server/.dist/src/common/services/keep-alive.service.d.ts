import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
export declare class KeepAliveService {
    private readonly configService;
    private readonly httpService;
    private readonly logger;
    constructor(configService: ConfigService, httpService: HttpService);
    private getBaseUrl;
    handleKeepAlive(): Promise<void>;
}
