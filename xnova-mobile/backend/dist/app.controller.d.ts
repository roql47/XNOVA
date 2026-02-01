export declare class AppController {
    private readonly MIN_REQUIRED_VERSION;
    private readonly LATEST_VERSION;
    getHello(): {
        name: string;
        version: string;
        description: string;
        endpoints: {
            auth: string;
            game: string;
            galaxy: string;
            ranking: string;
        };
    };
    healthCheck(): {
        status: string;
        timestamp: string;
    };
    checkVersion(currentVersion: string): {
        minRequiredVersion: string;
        latestVersion: string;
        forceUpdate: boolean;
        updateUrl: string;
        message: string | null;
    };
    private compareVersions;
}
