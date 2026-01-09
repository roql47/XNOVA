export declare class RegisterDto {
    email: string;
    password: string;
    playerName: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class GoogleAuthDto {
    idToken: string;
}
export declare class GoogleCompleteDto {
    idToken: string;
    playerName: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class LogoutDto {
    refreshToken: string;
}
export declare class KakaoLinkVerifyDto {
    code: string;
}
