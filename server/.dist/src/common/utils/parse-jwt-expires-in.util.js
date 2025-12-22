"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJwtExpiresIn = parseJwtExpiresIn;
function parseJwtExpiresIn(expiresIn) {
    const expiresInLower = expiresIn.toLowerCase().trim();
    const match = expiresInLower.match(/^(\d+)([a-z]+)?$/);
    if (!match) {
        return 7 * 24 * 60 * 60 * 1000;
    }
    const value = parseInt(match[1], 10);
    const unit = match[2] || 'ms';
    switch (unit) {
        case 'd':
            return value * 24 * 60 * 60 * 1000;
        case 'h':
            return value * 60 * 60 * 1000;
        case 'm':
            return value * 60 * 1000;
        case 's':
            return value * 1000;
        case 'ms':
            return value;
        default:
            return value;
    }
}
//# sourceMappingURL=parse-jwt-expires-in.util.js.map