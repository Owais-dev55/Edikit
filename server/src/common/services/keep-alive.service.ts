import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private getBaseUrl(): string {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const port = this.configService.get<string>('PORT', '3000');

    if (nodeEnv === 'production') {
      const renderUrl = this.configService.get<string>('RENDER_EXTERNAL_URL');
      if (renderUrl) {
        return renderUrl;
      }
      return `http://localhost:${port}`;
    }

    return `http://localhost:${port}`;
  }

  @Cron('*/14 * * * *')
  async handleKeepAlive() {
    const baseUrl = this.getBaseUrl();
    try {
      const response = await firstValueFrom(
        this.httpService.get<string>(`${baseUrl}/`, {
          timeout: 5000,
        }),
      );
      this.logger.log(
        `✅ Keep-alive ping successful (${response.status}): ${response.data}`,
      );
    } catch (error) {
      this.logger.warn(
        `⚠️ Keep-alive ping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
