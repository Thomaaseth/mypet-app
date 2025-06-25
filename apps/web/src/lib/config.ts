'use client'

function getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

// function getNodeEnv(): 'development' | 'production' | 'test' {
//     return (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
// }

const nodeEnv = process.env.NODE_ENV || 'development';


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

// const nodeEnv = getNodeEnv();

export const config: WebConfig = {
    app: {
        url: getRequiredEnv('NEXT_PUBLIC_APP_URL'),
        baseUrl: getRequiredEnv('NEXT_PUBLIC_APP_URL'),
        isDevelopment: nodeEnv === 'development',
        isProduction: nodeEnv === 'production',
        isTest: nodeEnv === 'test',
    },
    api: {
        baseUrl: getRequiredEnv('NEXT_PUBLIC_API_URL'),
    },
    auth: {
        callbackBaseUrl: getRequiredEnv('NEXT_PUBLIC_APP_URL'),
    },
};

if (config.app.isDevelopment) {
    console.log('🔧 Config loaded:', {
        NODE_ENV: nodeEnv,
        appUrl: config.app.url,
        apiUrl: config.api.baseUrl,
    });
}


// 'use client'

// import { useEffect, useState } from 'react'

// type WebConfig = {
//     app: {
//         url: string;
//         baseUrl: string;
//         isDevelopment: boolean;
//         isProduction: boolean;
//         isTest: boolean;
//     };
//     api: {
//         baseUrl: string;
//     };
//     auth: {
//         callbackBaseUrl: string;
//     };
// }

// // ✅ SOLUTION: Hook-based config that avoids hydration issues
// export function useConfig(): WebConfig | null {
//     const [config, setConfig] = useState<WebConfig | null>(null)

//     useEffect(() => {
//         // This runs ONLY on client-side, after hydration
//         const nodeEnv = process.env.NODE_ENV || 'development'
//         const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
//         const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''

//         if (!appUrl || !apiUrl) {
//             console.error('Missing environment variables:', { appUrl, apiUrl })
//             return
//         }

//         setConfig({
//             app: {
//                 url: appUrl,
//                 baseUrl: appUrl,
//                 isDevelopment: nodeEnv === 'development',
//                 isProduction: nodeEnv === 'production',
//                 isTest: nodeEnv === 'test',
//             },
//             api: {
//                 baseUrl: apiUrl,
//             },
//             auth: {
//                 callbackBaseUrl: appUrl,
//             },
//         })
//     }, [])

//     return config
// }

// // ✅ FALLBACK: Static config for non-hook usage (client-only)
// export const getConfig = (): WebConfig => {
//     const nodeEnv = process.env.NODE_ENV || 'development'
//     const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
//     const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

//     return {
//         app: {
//             url: appUrl,
//             baseUrl: appUrl,
//             isDevelopment: nodeEnv === 'development',
//             isProduction: nodeEnv === 'production',
//             isTest: nodeEnv === 'test',
//         },
//         api: {
//             baseUrl: apiUrl,
//         },
//         auth: {
//             callbackBaseUrl: appUrl,
//         },
//     }
// }