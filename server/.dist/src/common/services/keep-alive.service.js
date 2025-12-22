"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KeepAliveService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeepAliveService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let KeepAliveService = KeepAliveService_1 = class KeepAliveService {
    configService;
    httpService;
    logger = new common_1.Logger(KeepAliveService_1.name);
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
    }
    getBaseUrl() {
        const nodeEnv = this.configService.get('NODE_ENV', 'development');
        const port = this.configService.get('PORT', '3000');
        if (nodeEnv === 'production') {
            const renderUrl = this.configService.get('RENDER_EXTERNAL_URL');
            if (renderUrl) {
                return renderUrl;
            }
            return `http://localhost:${port}`;
        }
        return `http://localhost:${port}`;
    }
    async handleKeepAlive() {
        const baseUrl = this.getBaseUrl();
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${baseUrl}/`, {
                timeout: 5000,
            }));
            this.logger.log(`✅ Keep-alive ping successful (${response.status}): ${response.data}`);
        }
        catch (error) {
            this.logger.warn(`⚠️ Keep-alive ping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.KeepAliveService = KeepAliveService;
__decorate([
    (0, schedule_1.Cron)('*/14 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KeepAliveService.prototype, "handleKeepAlive", null);
exports.KeepAliveService = KeepAliveService = KeepAliveService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], KeepAliveService);
//# sourceMappingURL=keep-alive.service.js.map