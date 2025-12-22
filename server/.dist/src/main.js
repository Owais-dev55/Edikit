"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const port = process.env.PORT || 3000;
    const nodeEnv = process.env.NODE_ENV || 'development';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    app.use((0, helmet_1.default)());
    app.use((0, cookie_parser_1.default)());
    app.enableCors({
        origin: [frontendUrl, 'http://localhost:3000', 'http://localhost:5173'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Edikit API')
        .setDescription('REST API for Edikit SaaS application')
        .setVersion('1.0')
        .addCookieAuth('user_token', {
        type: 'http',
        in: 'cookie',
        scheme: 'bearer',
    })
        .addTag('Authentication', 'User authentication endpoints')
        .addTag('Users', 'User management endpoints')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api-docs', app, document);
    await app.listen(port);
    console.log(`Server is running on http://localhost:${port} in ${nodeEnv} mode`);
    console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
}
void bootstrap();
//# sourceMappingURL=main.js.map