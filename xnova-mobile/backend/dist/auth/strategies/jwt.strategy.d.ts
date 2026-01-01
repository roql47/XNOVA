import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { BlacklistedTokenDocument } from '../schemas/blacklisted-token.schema';
import { Request } from 'express';
interface JwtPayload {
    sub: string;
    email: string;
    userAgent: string;
    ipAddress: string;
    iat: number;
    exp: number;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private blacklistedTokenModel;
    constructor(configService: ConfigService, blacklistedTokenModel: Model<BlacklistedTokenDocument>);
    private hashString;
    validate(req: Request, payload: JwtPayload): Promise<{
        userId: string;
        email: string;
    }>;
}
export {};
