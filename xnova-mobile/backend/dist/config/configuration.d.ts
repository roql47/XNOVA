declare const _default: () => {
    port: number;
    database: {
        uri: string | undefined;
    };
    jwt: {
        secret: string | undefined;
        expiresIn: string;
    };
    google: {
        clientId: string | undefined;
    };
    cors: {
        origins: string[];
    };
};
export default _default;
