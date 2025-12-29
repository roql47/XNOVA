export declare class AppController {
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
}
