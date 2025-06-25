'use client'

type WebConfig = {
    app: {
        url: string;
        baseUrl: string;
        isDevelopment: boolean;
        isProduction: boolean;
        isTest: boolean;
    };
    api: {
        baseUrl: string;
    };
    auth: {
        callbackBaseUrl: string;
    };
};

export const getConfig = (): WebConfig => {
    const nodeEnv = process.env.NODE_ENV || 'development'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

    return {
        app: {
            url: appUrl,
            baseUrl: appUrl,
            isDevelopment: nodeEnv === 'development',
            isProduction: nodeEnv === 'production',
            isTest: nodeEnv === 'test',
        },
        api: {
            baseUrl: apiUrl,
        },
        auth: {
            callbackBaseUrl: appUrl,
        },
    }
}

if (getConfig().app.isDevelopment) {
    console.log('🔧 Config loaded:', {
        NODE_ENV: getConfig().app.isDevelopment ? 'development' : getConfig().app.isProduction ? 'production' : 'test', // Access nodeEnv status from getConfig()
        appUrl: getConfig().app.url,
        apiUrl: getConfig().api.baseUrl,
    });
}
