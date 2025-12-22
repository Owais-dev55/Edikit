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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const user_service_1 = require("../user/user.service");
const argon2_1 = require("argon2");
const auth_cookie_util_1 = require("../../common/utils/auth-cookie.util");
const client_1 = require("@generated/prisma/client");
const apple_signin_auth_1 = __importDefault(require("apple-signin-auth"));
let AuthService = class AuthService {
    prisma;
    userService;
    jwtService;
    configService;
    constructor(prisma, userService, jwtService, configService) {
        this.prisma = prisma;
        this.userService = userService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(registerDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const existingFullName = await this.prisma.user.findUnique({
            where: { fullName: registerDto.fullName },
        });
        if (existingFullName) {
            throw new common_1.ConflictException('User with this name already exists');
        }
        const hashedPassword = await (0, argon2_1.hash)(registerDto.password);
        const firstUser = await this.prisma.user.findFirst({
            select: { id: true },
        });
        const role = firstUser ? client_1.Role.USER : client_1.Role.ADMIN;
        const user = await this.prisma.user.create({
            data: {
                fullName: registerDto.fullName,
                email: registerDto.email,
                password: hashedPassword,
                role,
                planType: client_1.PlanType.FREE,
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
    async login(loginDto, res) {
        const user = await this.validateLocalUser(loginDto.email, loginDto.password);
        return this.generateTokenAndSetCookie(user, res);
    }
    async validateLocalUser(email, password) {
        try {
            const user = await this.userService.findUserByEmail(email);
            if (!user.password) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const passwordMatched = await (0, argon2_1.verify)(user.password, password);
            if (!passwordMatched) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            return {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                planType: user.planType,
            };
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
    }
    async validateJwtUser(userId) {
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
    async generateToken(userId) {
        const payload = {
            sub: {
                userId,
            },
        };
        return await this.jwtService.signAsync(payload);
    }
    async generateTokenAndSetCookie(user, res) {
        const userId = (user.id || user.userId);
        const token = await this.generateToken(userId);
        (0, auth_cookie_util_1.setAuthCookie)(res, token, this.configService);
        return {
            userId,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            planType: user.planType,
        };
    }
    async handleGoogleAuth(profile, res) {
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
            }
            else {
                const firstUser = await this.prisma.user.findFirst({
                    select: { id: true },
                });
                const role = firstUser ? client_1.Role.USER : client_1.Role.ADMIN;
                user = await this.prisma.user.create({
                    data: {
                        fullName: profile.fullName,
                        email: profile.email,
                        googleId: profile.googleId,
                        provider: 'google',
                        role,
                        planType: client_1.PlanType.FREE,
                        avatar: profile.avatar || '',
                    },
                });
            }
        }
        return this.generateTokenAndSetCookie(user, res);
    }
    async handleAppleAuth(identityToken, fullName, res) {
        try {
            const clientId = this.configService.get('APPLE_CLIENT_ID');
            const appleUser = await apple_signin_auth_1.default.verifyIdToken(identityToken, {
                audience: clientId,
            });
            const appleId = appleUser.sub;
            const email = appleUser.email;
            if (!email) {
                throw new common_1.UnauthorizedException('Email not provided by Apple');
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
                }
                else {
                    const firstUser = await this.prisma.user.findFirst({
                        select: { id: true },
                    });
                    const role = firstUser ? client_1.Role.USER : client_1.Role.ADMIN;
                    user = await this.prisma.user.create({
                        data: {
                            fullName: fullName || 'Apple User',
                            email,
                            appleId,
                            provider: 'apple',
                            role,
                            planType: client_1.PlanType.FREE,
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
        }
        catch {
            throw new common_1.UnauthorizedException('Apple authentication failed');
        }
    }
    async getCurrentUser(userId) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        user_service_1.UserService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map