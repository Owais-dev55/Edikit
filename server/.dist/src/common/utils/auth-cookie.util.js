"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthCookie = setAuthCookie;
exports.clearAuthCookie = clearAuthCookie;
const parse_jwt_expires_in_util_1 = require("./parse-jwt-expires-in.util");
function setAuthCookie(res, token, configService) {
    const expiresIn = configService.get('JWT_EXPIRES_IN', '7d');
    const maxAge = (0, parse_jwt_expires_in_util_1.parseJwtExpiresIn)(expiresIn);
    res.cookie(configService.get('JWT_TOKEN_NAME', 'user_token'), token, {
        httpOnly: true,
        secure: configService.get('NODE_ENV') === 'production',
        sameSite: 'lax',
        maxAge,
    });
}
function clearAuthCookie(res, configService) {
    res.clearCookie(configService.get('JWT_TOKEN_NAME', 'user_token'), {
        httpOnly: true,
        secure: configService.get('NODE_ENV') === 'production',
        sameSite: 'lax',
    });
}
//# sourceMappingURL=auth-cookie.util.js.map