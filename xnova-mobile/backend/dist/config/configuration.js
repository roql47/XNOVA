"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    database: {
        uri: process.env.MONGODB_URI || 'mongodb+srv://r4823120_db_user:wiztech0926@cluster0.6ovf2ru.mongodb.net/xnova?retryWrites=true&w=majority',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'xnova-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
});
//# sourceMappingURL=configuration.js.map