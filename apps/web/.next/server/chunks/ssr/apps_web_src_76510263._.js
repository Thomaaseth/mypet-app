module.exports = {

"[project]/apps/web/src/lib/api/errors.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "ApiError": (()=>ApiError),
    "BadRequestError": (()=>BadRequestError),
    "ForbiddenError": (()=>ForbiddenError),
    "NetworkError": (()=>NetworkError),
    "NotFoundError": (()=>NotFoundError),
    "ServerError": (()=>ServerError),
    "TimeoutError": (()=>TimeoutError),
    "UnauthorizedError": (()=>UnauthorizedError),
    "ValidationError": (()=>ValidationError),
    "createApiError": (()=>createApiError),
    "logApiError": (()=>logApiError)
});
class ApiError extends Error {
    status;
    code;
    context;
    timestamp;
    constructor(message, status = 500, code = 'API_ERROR', context){
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.context = context;
        this.timestamp = new Date().toISOString();
        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }
    getDebugInfo() {
        if (!this.context) return this.message;
        return `
API Error Debug Info:
- Message: ${this.message}
- Status: ${this.status}
- Code: ${this.code}
- Timestamp: ${this.timestamp}
- URL: ${this.context.url}
- Method: ${this.context.method}
- Request Body: ${JSON.stringify(this.context.requestBody, null, 2)}
- Response Body: ${JSON.stringify(this.context.responseBody, null, 2)}
- Correlation ID: ${this.context.correlationId || 'N/A'}
    `.trim();
    }
    toLogData() {
        return {
            message: this.message,
            status: this.status,
            code: this.code,
            timestamp: this.timestamp,
            stack: this.stack,
            context: this.context
        };
    }
}
class BadRequestError extends ApiError {
    constructor(message = 'Bad request', context){
        super(message, 400, 'BAD_REQUEST', context);
        this.name = 'BadRequestError';
    }
}
class UnauthorizedError extends ApiError {
    constructor(message = 'Authentication required', context){
        super(message, 401, 'UNAUTHORIZED', context);
        this.name = 'UnauthorizedError';
    }
}
class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden', context){
        super(message, 403, 'FORBIDDEN', context);
        this.name = 'ForbiddenError';
    }
}
class NotFoundError extends ApiError {
    constructor(message = 'Resource not found', context){
        super(message, 404, 'NOT_FOUND', context);
        this.name = 'NotFoundError';
    }
}
class ValidationError extends ApiError {
    field;
    constructor(message = 'Validation failed', field, context){
        super(message, 422, 'VALIDATION_ERROR', context);
        this.name = 'ValidationError';
        this.field = field;
    }
}
class NetworkError extends ApiError {
    constructor(message = 'Network error', context){
        super(message, 0, 'NETWORK_ERROR', context);
        this.name = 'NetworkError';
    }
}
class TimeoutError extends ApiError {
    constructor(message = 'Request timeout', context){
        super(message, 408, 'TIMEOUT_ERROR', context);
        this.name = 'TimeoutError';
    }
}
class ServerError extends ApiError {
    constructor(message = 'Internal server error', status = 500, context){
        super(message, status, 'SERVER_ERROR', context);
        this.name = 'ServerError';
    }
}
function createApiError(message, status, context) {
    switch(status){
        case 400:
            return new BadRequestError(message, context);
        case 401:
            return new UnauthorizedError(message, context);
        case 403:
            return new ForbiddenError(message, context);
        case 404:
            return new NotFoundError(message, context);
        case 408:
            return new TimeoutError(message, context);
        case 422:
            return new ValidationError(message, undefined, context);
        default:
            if (status >= 500) {
                return new ServerError(message, status, context);
            }
            return new ApiError(message, status, 'API_ERROR', context);
    }
}
function logApiError(error) {
    if ("TURBOPACK compile-time truthy", 1) {
        console.group(`🚨 API Error: ${error.code}`);
        console.error(error.getDebugInfo());
        console.groupEnd();
    }
}
}}),
"[project]/apps/web/src/lib/api/core/parser.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "parseApiResponse": (()=>parseApiResponse)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/errors.ts [app-ssr] (ecmascript)");
;
// Requests tracking
function generateCorrelationId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
async function parseApiResponse(response, context) {
    let responseBody;
    const enhancedContext = {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        correlationId: context.correlationId || generateCorrelationId(),
        status: response.status
    };
    try {
        const text = await response.text();
        responseBody = text ? JSON.parse(text) : {};
        // Type-safe assignment to context
        if (typeof responseBody === 'string') {
            context.responseBody = responseBody;
        } else if (isApiSuccessResponse(responseBody) || isApiErrorResponse(responseBody)) {
            context.responseBody = responseBody;
        } else {
            context.responseBody = String(responseBody);
        }
    } catch  {
        const error = new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiError"]('Invalid JSON response from server', response.status, 'PARSE_ERROR', {
            ...context,
            status: response.status
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logApiError"])(error);
        throw error;
    }
    if (!response.ok) {
        const errorMessage = isApiErrorResponse(responseBody) ? responseBody.error : `HTTP ${response.status}: ${response.statusText}`;
        const errorResponseBody = isApiErrorResponse(responseBody) ? responseBody : undefined;
        enhancedContext.responseBody = errorResponseBody;
        const error = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createApiError"])(errorMessage, response.status, enhancedContext);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logApiError"])(error);
        throw error;
    }
    if (isApiSuccessResponse(responseBody)) {
        return responseBody.data;
    }
    return responseBody;
}
function isApiErrorResponse(obj) {
    return typeof obj === 'object' && obj !== null && 'error' in obj && typeof obj.error === 'string';
}
function isApiSuccessResponse(obj) {
    return typeof obj === 'object' && obj !== null && 'data' in obj;
}
}}),
"[project]/apps/web/src/lib/api/core/http.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "makeApiRequest": (()=>makeApiRequest),
    "makeAuthenticatedRequest": (()=>makeAuthenticatedRequest)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/config.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/errors.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$core$2f$parser$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/core/parser.ts [app-ssr] (ecmascript)");
;
;
;
// Base API configuration
const API_BASE_URL = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getApiUrl"])();
const DEFAULT_TIMEOUT = 30000; // 30 seconds
async function makeApiRequest(endpoint, config = {}) {
    const { method = 'GET', body, params, timeout = DEFAULT_TIMEOUT, headers: customHeaders = {}, ...restConfig } = config;
    // Build URL with query parameters
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
        Object.entries(params).forEach(([key, value])=>{
            url.searchParams.append(key, String(value));
        });
    }
    // Prepare headers
    const headers = {
        'Content-Type': 'application/json',
        ...customHeaders
    };
    // Prepare request body
    let requestBody;
    if (body && method !== 'GET') {
        if (body instanceof FormData || body instanceof URLSearchParams) {
            requestBody = body;
            // Remove Content-Type for FormData to let browser set boundary
            if (body instanceof FormData) {
                delete headers['Content-Type'];
            }
        } else if (typeof body === 'string') {
            requestBody = body;
        } else if (typeof body === 'object' && body !== null) {
            requestBody = JSON.stringify(body);
        }
    }
    // Create error context for debugging
    const errorContext = {
        url: url.toString(),
        method,
        requestBody: body,
        timestamp: new Date().toISOString(),
        correlationId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), timeout);
    try {
        const response = await fetch(url.toString(), {
            method,
            headers,
            body: requestBody,
            credentials: 'include',
            signal: controller.signal,
            ...restConfig
        });
        clearTimeout(timeoutId);
        // Parse response
        const responseData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$core$2f$parser$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseApiResponse"])(response, errorContext);
        return {
            data: responseData,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        };
    } catch (error) {
        clearTimeout(timeoutId);
        // Handle different error types
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiError"]) {
            throw error;
        }
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TimeoutError"](`Request timeout after ${timeout}ms`, errorContext);
        }
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NetworkError"]('Network connection failed', errorContext);
        }
        // Unknown error
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiError"](error instanceof Error ? error.message : 'An unexpected error occurred', 500, 'UNKNOWN_ERROR', errorContext);
    }
}
async function makeAuthenticatedRequest(endpoint, config = {}) {
    try {
        return await makeApiRequest(endpoint, config);
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiError"] && error.status === 401) {
            // Handle authentication errors - could trigger logout logic here
            console.warn('Authentication failed - user may need to log in again');
        }
        throw error;
    }
}
}}),
"[project]/apps/web/src/lib/api/core/index.ts [app-ssr] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$core$2f$http$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/core/http.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$core$2f$parser$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/core/parser.ts [app-ssr] (ecmascript)");
;
;
}}),
"[project]/apps/web/src/lib/api/core/index.ts [app-ssr] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$core$2f$http$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/core/http.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$core$2f$parser$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/core/parser.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$core$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/core/index.ts [app-ssr] (ecmascript) <locals>");
}}),
"[project]/apps/web/src/lib/api/base.ts [app-ssr] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "del": (()=>del),
    "get": (()=>get),
    "patch": (()=>patch),
    "post": (()=>post),
    "put": (()=>put)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$core$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/core/index.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$core$2f$http$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/core/http.ts [app-ssr] (ecmascript)");
;
async function get(endpoint, params, config) {
    const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$core$2f$http$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeAuthenticatedRequest"])(endpoint, {
        method: 'GET',
        params,
        ...config
    });
    return response.data;
}
async function post(endpoint, body, config) {
    const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$core$2f$http$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeAuthenticatedRequest"])(endpoint, {
        method: 'POST',
        body: body,
        ...config
    });
    return response.data;
}
async function put(endpoint, body, config) {
    const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$core$2f$http$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeAuthenticatedRequest"])(endpoint, {
        method: 'PUT',
        body: body,
        ...config
    });
    return response.data;
}
async function del(endpoint, config) {
    const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$core$2f$http$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeAuthenticatedRequest"])(endpoint, {
        method: 'DELETE',
        ...config
    });
    return response.data;
}
async function patch(endpoint, body, config) {
    const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$core$2f$http$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeAuthenticatedRequest"])(endpoint, {
        method: 'PATCH',
        body: body,
        ...config
    });
    return response.data;
}
;
}}),
"[project]/apps/web/src/lib/api/base.ts [app-ssr] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$core$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/core/index.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/base.ts [app-ssr] (ecmascript) <locals>");
}}),
"[project]/apps/web/src/lib/api/pets.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "petApi": (()=>petApi),
    "petErrorHandler": (()=>petErrorHandler)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/base.ts [app-ssr] (ecmascript) <module evaluation>"); // Use base functions directly
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/base.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/errors.ts [app-ssr] (ecmascript)");
;
;
const petApi = {
    async getPets () {
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["get"])('/api/pets');
        } catch (error) {
            console.error('Error fetching pets:', error);
            throw error;
        }
    },
    async getPetById (petId) {
        try {
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["get"])(`/api/pets/${petId}`);
            return result.pet;
        } catch (error) {
            console.error('Error fetching pet:', error);
            throw error;
        }
    },
    async createPet (petData) {
        try {
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["post"])('/api/pets', petData);
            return result.pet;
        } catch (error) {
            console.error('Error creating pet:', error);
            throw error;
        }
    },
    async updatePet (petId, petData) {
        try {
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["put"])(`/api/pets/${petId}`, petData);
            return result.pet;
        } catch (error) {
            console.error('Error updating pet:', error);
            throw error;
        }
    },
    async deletePet (petId) {
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["del"])(`/api/pets/${petId}`);
        } catch (error) {
            console.error('Error deleting pet:', error);
            throw error;
        }
    },
    async permanentlyDeletePet (petId) {
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["del"])(`/api/pets/${petId}/permanent`);
        } catch (error) {
            console.error('Error permanently deleting pet:', error);
            throw error;
        }
    },
    async getPetCount () {
        try {
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["get"])('/api/pets/stats/count');
            return result.count;
        } catch (error) {
            console.error('Error fetching pet count:', error);
            throw error;
        }
    }
};
const petErrorHandler = (error)=>{
    let message;
    let field;
    let code;
    // Handle API error types
    if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ValidationError"]) {
        message = error.message;
        field = error.field;
        code = error.code;
    } else if (error instanceof Error) {
        message = error.message;
        code = 'PET_ERROR';
    } else if (typeof error === 'string') {
        message = error;
        code = 'PET_ERROR';
    } else {
        message = 'An error occurred while processing your request';
        code = 'PET_ERROR';
    }
    // Map specific validation errors to fields
    if (message.includes('name')) {
        field = 'name';
        code = 'INVALID_NAME';
    } else if (message.includes('species') || message.includes('breed')) {
        field = 'species';
        code = 'INVALID_SPECIES';
    } else if (message.includes('weight')) {
        field = 'weight';
        code = 'INVALID_WEIGHT';
    } else if (message.includes('birth') || message.includes('date')) {
        field = 'birthDate';
        code = 'INVALID_DATE';
    } else if (message.includes('microchip')) {
        field = 'microchipNumber';
        code = 'INVALID_MICROCHIP';
    } else if (message.includes('not found')) {
        code = 'PET_NOT_FOUND';
    } else if (message.includes('unauthorized') || message.includes('forbidden')) {
        code = 'UNAUTHORIZED';
    }
    return {
        message,
        field,
        code
    };
};
}}),
"[project]/apps/web/src/lib/validations/pet.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "basePetFormSchema": (()=>basePetFormSchema),
    "calculatePetAge": (()=>calculatePetAge),
    "commonSpeciesSuggestions": (()=>commonSpeciesSuggestions),
    "convertWeight": (()=>convertWeight),
    "createPetSchema": (()=>createPetSchema),
    "formatWeight": (()=>formatWeight),
    "getWeightInKg": (()=>getWeightInKg),
    "getWeightInLbs": (()=>getWeightInLbs),
    "petFormSchema": (()=>petFormSchema),
    "petGenderSchema": (()=>petGenderSchema),
    "updatePetSchema": (()=>updatePetSchema),
    "validateCreatePet": (()=>validateCreatePet),
    "validatePetForm": (()=>validatePetForm),
    "validateUpdatePet": (()=>validateUpdatePet),
    "weightUnitSchema": (()=>weightUnitSchema)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/dist/esm/index.js [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/dist/esm/v3/external.js [app-ssr] (ecmascript) <export * as z>");
;
const petGenderSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'male',
    'female',
    'unknown'
], {
    errorMap: ()=>({
            message: 'Please select a valid gender'
        })
});
const weightUnitSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'kg',
    'lbs'
], {
    errorMap: ()=>({
            message: 'Please select a valid weight unit'
        })
});
const basePetFormSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Pet name is required').max(50, 'Pet name must be less than 50 characters').regex(/^[a-zA-Z\s\-'\.]+$/, 'Pet name can only contain letters, spaces, hyphens, apostrophes, and periods'),
    animalType: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'cat',
        'dog'
    ], {
        errorMap: ()=>({
                message: 'Please select if this is a cat or dog'
            })
    }),
    species: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(50, 'Species/breed must be less than 50 characters').regex(/^[a-zA-Z\s\-'\.]*$/, 'Species/breed can only contain letters, spaces, hyphens, apostrophes, and periods').optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('')),
    gender: petGenderSchema,
    birthDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().refine((date)=>{
        if (!date) return true; // Optional field
        const parsedDate = new Date(date);
        const today = new Date();
        const maxAge = new Date();
        maxAge.setFullYear(today.getFullYear() - 30); // 30 years max age
        return parsedDate <= today && parsedDate >= maxAge;
    }, 'Please enter a valid birth date (not in the future, not older than 30 years)').optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('')),
    weight: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('')),
    weightUnit: weightUnitSchema,
    isNeutered: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    microchipNumber: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^[A-Za-z0-9]*$/, 'Microchip number can only contain letters and numbers').max(50, 'Microchip number must be less than 50 characters').optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('')),
    notes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(1000, 'Notes must be less than 1000 characters').optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(''))
});
const petFormSchema = basePetFormSchema.refine((data)=>{
    if (!data.weight) return true; // Optional field
    const weight = parseFloat(data.weight);
    if (isNaN(weight) || weight <= 0) return false;
    // Unit-specific validation
    if (data.weightUnit === 'kg') {
        return weight <= 200; // Max 200kg (440 lbs)
    } else if (data.weightUnit === 'lbs') {
        return weight <= 440; // Max 440 lbs (200kg)
    }
    return true;
}, {
    message: 'Weight exceeds maximum allowed (200kg / 440lbs)',
    path: [
        'weight'
    ]
});
const createPetSchema = basePetFormSchema.extend({
    name: basePetFormSchema.shape.name
}).refine((data)=>{
    if (!data.weight) return true; // Optional field
    const weight = parseFloat(data.weight);
    if (isNaN(weight) || weight <= 0) return false;
    // Unit-specific validation
    if (data.weightUnit === 'kg') {
        return weight <= 200; // Max 200kg (440 lbs)
    } else if (data.weightUnit === 'lbs') {
        return weight <= 440; // Max 440 lbs (200kg)
    }
    return true;
}, {
    message: 'Weight exceeds maximum allowed (200kg / 440lbs)',
    path: [
        'weight'
    ]
});
const updatePetSchema = basePetFormSchema.partial().extend({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid('Invalid pet ID')
}).refine((data)=>{
    if (!data.weight) return true; // Optional field
    const weight = parseFloat(data.weight);
    if (isNaN(weight) || weight <= 0) return false;
    // Unit-specific validation
    if (data.weightUnit === 'kg') {
        return weight <= 200; // Max 200kg (440 lbs)
    } else if (data.weightUnit === 'lbs') {
        return weight <= 440; // Max 440 lbs (200kg)
    }
    return true;
}, {
    message: 'Weight exceeds maximum allowed (200kg / 440lbs)',
    path: [
        'weight'
    ]
});
const validatePetForm = (data)=>{
    return petFormSchema.safeParse(data);
};
const validateCreatePet = (data)=>{
    return createPetSchema.safeParse(data);
};
const validateUpdatePet = (data)=>{
    return updatePetSchema.safeParse(data);
};
const convertWeight = (weight, fromUnit, toUnit)=>{
    if (fromUnit === toUnit) return weight;
    if (fromUnit === 'kg' && toUnit === 'lbs') {
        return weight * 2.20462;
    } else if (fromUnit === 'lbs' && toUnit === 'kg') {
        return weight / 2.20462;
    }
    return weight;
};
const formatWeight = (weight, unit)=>{
    if (!weight) return 'Unknown';
    return `${weight} ${unit}`;
};
const getWeightInKg = (weight, unit)=>{
    if (!weight) return null;
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum)) return null;
    return unit === 'kg' ? weightNum : convertWeight(weightNum, 'lbs', 'kg');
};
const getWeightInLbs = (weight, unit)=>{
    if (!weight) return null;
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum)) return null;
    return unit === 'lbs' ? weightNum : convertWeight(weightNum, 'kg', 'lbs');
};
const calculatePetAge = (birthDate)=>{
    if (!birthDate) return 'Unknown';
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    if (months < 0 || months === 0 && today.getDate() < birth.getDate()) {
        const adjustedYears = years - 1;
        const adjustedMonths = months < 0 ? 12 + months : months;
        if (adjustedYears === 0) {
            return `${adjustedMonths} month${adjustedMonths !== 1 ? 's' : ''}`;
        }
        return `${adjustedYears} year${adjustedYears !== 1 ? 's' : ''}, ${adjustedMonths} month${adjustedMonths !== 1 ? 's' : ''}`;
    }
    if (years === 0) {
        return `${months} month${months !== 1 ? 's' : ''}`;
    }
    return years === 1 ? '1 year' : `${years} years`;
};
const commonSpeciesSuggestions = {
    cat: [
        'Mixed Breed',
        'Persian Cat',
        'Maine Coon',
        'British Shorthair',
        'Ragdoll',
        'Bengal Cat',
        'Siamese Cat',
        'Russian Blue',
        'Scottish Fold'
    ],
    dog: [
        'Mixed Breed',
        'Labrador Retriever',
        'Golden Retriever',
        'German Shepherd',
        'French Bulldog',
        'Bulldog',
        'Poodle',
        'Beagle',
        'Rottweiler',
        'Yorkshire Terrier'
    ]
};
}}),
"[project]/apps/web/src/lib/api/domains/weights/service.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "WeightService": (()=>WeightService)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/errors.ts [app-ssr] (ecmascript)");
;
class WeightService {
    repository;
    validator;
    constructor(repository, validator){
        this.repository = repository;
        this.validator = validator;
    }
    async getWeightEntries(petId) {
        try {
            return await this.repository.getWeightEntries(petId);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    async getWeightEntryById(petId, weightId) {
        try {
            return await this.repository.getWeightEntryById(petId, weightId);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    async createWeightEntry(petId, weightData, weightUnit) {
        try {
            // Validate the data
            this.validator.validateWeightEntry(weightData, weightUnit);
            return await this.repository.createWeightEntry(petId, weightData);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    async updateWeightEntry(petId, weightId, weightData, weightUnit) {
        try {
            // Only validate if weight or date is being updated
            if (weightData.weight || weightData.date) {
                const fullData = {
                    weight: weightData.weight || '0',
                    date: weightData.date || new Date().toISOString().split('T')[0]
                };
                this.validator.validateWeightEntry(fullData, weightUnit);
            }
            return await this.repository.updateWeightEntry(petId, weightId, weightData);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    async deleteWeightEntry(petId, weightId) {
        try {
            await this.repository.deleteWeightEntry(petId, weightId);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    // Error handling - follows the same pattern as PetService
    handleError(error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiError"]) {
            return error;
        }
        if (error instanceof Error) {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiError"](error.message, 500, 'WEIGHT_ERROR');
        }
        return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiError"]('An unexpected error occurred', 500, 'WEIGHT_ERROR');
    }
    // Error mapping for UI consumption - follows petService pattern
    mapError(error) {
        let message = 'An error occurred while processing your request';
        let field;
        let code = 'WEIGHT_ERROR';
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UnauthorizedError"]) {
            return {
                message: 'You must be logged in to perform this action',
                code: 'UNAUTHORIZED'
            };
        }
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ForbiddenError"]) {
            return {
                message: 'You do not have permission to access this pet\'s weight data',
                code: 'FORBIDDEN'
            };
        }
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NotFoundError"]) {
            return {
                message: 'Weight entry not found',
                code: 'WEIGHT_NOT_FOUND'
            };
        }
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiError"]) {
            message = error.message;
            code = error.code;
        } else if (error instanceof Error) {
            message = error.message;
            code = 'WEIGHT_ERROR';
        } else if (typeof error === 'string') {
            message = error;
            code = 'WEIGHT_ERROR';
        }
        // Map specific validation errors to fields
        if (message.toLowerCase().includes('weight')) {
            field = 'weight';
            code = 'INVALID_WEIGHT';
        } else if (message.toLowerCase().includes('date')) {
            field = 'date';
            code = 'INVALID_DATE';
        } else if (message.toLowerCase().includes('future')) {
            field = 'date';
            code = 'FUTURE_DATE';
        } else if (message.toLowerCase().includes('not found')) {
            code = 'WEIGHT_NOT_FOUND';
        } else if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('forbidden')) {
            code = 'UNAUTHORIZED';
        }
        return {
            message,
            field,
            code
        };
    }
}
}}),
"[project]/apps/web/src/lib/api/domains/weights/repository.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "WeightRepository": (()=>WeightRepository),
    "weightRepository": (()=>weightRepository)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/base.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/base.ts [app-ssr] (ecmascript) <locals>");
;
class WeightRepository {
    async getWeightEntries(petId) {
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["get"])(`/api/pets/${petId}/weights`);
    }
    async getWeightEntryById(petId, weightId) {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["get"])(`/api/pets/${petId}/weights/${weightId}`);
        return result.weightEntry;
    }
    async createWeightEntry(petId, weightData) {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["post"])(`/api/pets/${petId}/weights`, weightData);
        return result.weightEntry;
    }
    async updateWeightEntry(petId, weightId, weightData) {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["put"])(`/api/pets/${petId}/weights/${weightId}`, weightData);
        return result.weightEntry;
    }
    async deleteWeightEntry(petId, weightId) {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["del"])(`/api/pets/${petId}/weights/${weightId}`);
    }
}
const weightRepository = new WeightRepository();
}}),
"[project]/apps/web/src/lib/validations/weight.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "createWeightEntrySchema": (()=>createWeightEntrySchema),
    "formatDateForDisplay": (()=>formatDateForDisplay),
    "formatDateForInput": (()=>formatDateForInput),
    "getTodayDateString": (()=>getTodayDateString),
    "validateWeightEntry": (()=>validateWeightEntry),
    "weightEntryFormSchema": (()=>weightEntryFormSchema)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/dist/esm/index.js [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/dist/esm/v3/external.js [app-ssr] (ecmascript) <export * as z>");
;
const weightEntryFormSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    weight: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Weight is required').refine((val)=>{
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
    }, 'Weight must be a positive number'),
    date: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Date is required').refine((date)=>{
        const parsedDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Set to end of today
        // Check if it's a valid date and not in the future
        return !isNaN(parsedDate.getTime()) && parsedDate <= today;
    }, 'Date cannot be in the future')
});
const createWeightEntrySchema = (weightUnit)=>{
    return weightEntryFormSchema.refine((data)=>{
        const weight = parseFloat(data.weight);
        if (isNaN(weight) || weight <= 0) return false;
        // Unit-specific validation (same limits as pet validation)
        if (weightUnit === 'kg') {
            return weight <= 200; // Max 200kg (440 lbs)
        } else if (weightUnit === 'lbs') {
            return weight <= 440; // Max 440 lbs (200kg)
        }
        return true;
    }, {
        message: `Weight exceeds maximum allowed (200kg / 440lbs)`,
        path: [
            'weight'
        ]
    });
};
const validateWeightEntry = (data, weightUnit)=>{
    const schema = createWeightEntrySchema(weightUnit);
    return schema.safeParse(data);
};
const formatDateForDisplay = (dateString)=>{
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};
const formatDateForInput = (dateString)=>{
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};
const getTodayDateString = ()=>{
    return new Date().toISOString().split('T')[0];
};
}}),
"[project]/apps/web/src/lib/api/domains/weights/validator.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "WeightValidator": (()=>WeightValidator),
    "weightValidator": (()=>weightValidator)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$validations$2f$weight$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/validations/weight.ts [app-ssr] (ecmascript)");
;
class WeightValidator {
    validateWeightEntry(data, weightUnit) {
        const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$validations$2f$weight$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateWeightEntry"])(data, weightUnit);
        if (!result.success) {
            const firstError = result.error.errors[0];
            throw new Error(firstError.message);
        }
        return result.data;
    }
    validateWeightValue(weight, weightUnit) {
        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
            throw new Error('Weight must be a positive number');
        }
        // Unit-specific validation
        if (weightUnit === 'kg' && weightNum > 200) {
            throw new Error('Weight cannot exceed 200kg');
        }
        if (weightUnit === 'lbs' && weightNum > 440) {
            throw new Error('Weight cannot exceed 440lbs');
        }
        return weightNum;
    }
    validateDate(date) {
        const parsedDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date format');
        }
        if (parsedDate > today) {
            throw new Error('Date cannot be in the future');
        }
        return parsedDate;
    }
}
const weightValidator = new WeightValidator();
}}),
"[project]/apps/web/src/lib/api/domains/weights/index.ts [app-ssr] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "weightApi": (()=>weightApi),
    "weightErrorHandler": (()=>weightErrorHandler)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/weights/service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$repository$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/weights/repository.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$validator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/weights/validator.ts [app-ssr] (ecmascript)");
;
;
;
// Create configured service instance
const weightService = new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WeightService"](__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$repository$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["weightRepository"], __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$validator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["weightValidator"]);
const weightApi = {
    getWeightEntries: (petId)=>weightService.getWeightEntries(petId),
    getWeightEntryById: (petId, weightId)=>weightService.getWeightEntryById(petId, weightId),
    createWeightEntry: (petId, weightData, weightUnit)=>weightService.createWeightEntry(petId, weightData, weightUnit),
    updateWeightEntry: (petId, weightId, weightData, weightUnit)=>weightService.updateWeightEntry(petId, weightId, weightData, weightUnit),
    deleteWeightEntry: (petId, weightId)=>weightService.deleteWeightEntry(petId, weightId)
};
const weightErrorHandler = (error)=>weightService.mapError(error);
;
;
;
}}),
"[project]/apps/web/src/lib/api/domains/weights/index.ts [app-ssr] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/weights/service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$repository$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/weights/repository.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$validator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/weights/validator.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/weights/index.ts [app-ssr] (ecmascript) <locals>");
}}),
"[project]/apps/web/src/lib/validations/food.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "dryFoodSchema": (()=>dryFoodSchema),
    "formatDateForDisplay": (()=>formatDateForDisplay),
    "updateDryFoodSchema": (()=>updateDryFoodSchema),
    "updateWetFoodSchema": (()=>updateWetFoodSchema),
    "validateDryFoodData": (()=>validateDryFoodData),
    "validateUpdateDryFoodData": (()=>validateUpdateDryFoodData),
    "validateUpdateWetFoodData": (()=>validateUpdateWetFoodData),
    "validateWetFoodData": (()=>validateWetFoodData),
    "wetFoodSchema": (()=>wetFoodSchema)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/dist/esm/index.js [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/dist/esm/v3/external.js [app-ssr] (ecmascript) <export * as z>");
;
// Base validation
const baseFoodValidation = {
    brandName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(100, 'Brand name must be 100 characters or less').optional(),
    productName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(150, 'Product name must be 150 characters or less').optional(),
    dailyAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Daily amount is required').refine((val)=>{
        const num = parseFloat(val.replace(',', '.'));
        return !isNaN(num) && num > 0;
    }, 'Daily amount must be a positive number'),
    dateStarted: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Purchase date is required').refine((val)=>{
        const date = new Date(val);
        return !isNaN(date.getTime()) && date <= new Date();
    }, 'Purchase date must be valid and not in the future')
};
const dryFoodSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    ...baseFoodValidation,
    bagWeight: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Bag weight is required').refine((val)=>{
        const num = parseFloat(val.replace(',', '.'));
        return !isNaN(num) && num > 0;
    }, 'Bag weight must be a positive number'),
    bagWeightUnit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'kg',
        'pounds'
    ], {
        required_error: 'Bag weight unit is required',
        invalid_type_error: 'Invalid bag weight unit for dry food'
    }),
    dryDailyAmountUnit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'grams'
    ], {
        required_error: 'Daily amount unit is required',
        invalid_type_error: 'Invalid daily amount unit for dry food'
    })
}).superRefine((data, ctx)=>{
    // Validate daily amount doesn't exceed bag weight (basic sanity check)
    const bagWeight = parseFloat(data.bagWeight.replace(',', '.'));
    const dailyAmount = parseFloat(data.dailyAmount.replace(',', '.'));
    // Convert bag weight to grams for comparison
    let bagWeightInGrams = bagWeight;
    if (data.bagWeightUnit === 'kg') {
        bagWeightInGrams = bagWeight * 1000; // kg to grams
    } else if (data.bagWeightUnit === 'pounds') {
        bagWeightInGrams = bagWeight * 453.592; // pounds to grams
    }
    // Convert daily amount to grams for comparison
    const dailyAmountInGrams = dailyAmount;
    // Check if daily amount exceeds total bag weight
    if (dailyAmountInGrams >= bagWeightInGrams) {
        ctx.addIssue({
            code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodIssueCode.custom,
            message: 'Daily amount should be less than total bag weight',
            path: [
                'dailyAmount'
            ]
        });
    }
});
const wetFoodSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    ...baseFoodValidation,
    numberOfUnits: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string() // ✅ Expects string (from form)
    .min(1, 'Number of units is required').refine((val)=>{
        const num = parseInt(val, 10);
        return !isNaN(num) && Number.isInteger(num) && num > 0;
    }, 'Number of units must be a positive whole number'),
    weightPerUnit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Weight per unit is required').refine((val)=>{
        const num = parseFloat(val.replace(',', '.'));
        return !isNaN(num) && num > 0;
    }, 'Weight per unit must be a positive number'),
    wetWeightUnit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'grams',
        'oz'
    ], {
        required_error: 'Weight unit is required',
        invalid_type_error: 'Invalid weight unit for wet food'
    }),
    wetDailyAmountUnit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'grams',
        'oz'
    ], {
        required_error: 'Daily amount unit is required',
        invalid_type_error: 'Invalid daily amount unit for wet food'
    })
}).superRefine((data, ctx)=>{
    // Calculate total weight for validation
    const numberOfUnits = parseInt(data.numberOfUnits, 10);
    const totalWeight = numberOfUnits * parseFloat(data.weightPerUnit.replace(',', '.'));
    const dailyAmount = parseFloat(data.dailyAmount.replace(',', '.'));
    // Convert total weight to grams
    let totalWeightInGrams = totalWeight;
    if (data.wetWeightUnit === 'oz') {
        totalWeightInGrams = totalWeight * 28.3495; // oz to grams
    }
    // Convert daily amount to grams
    let dailyAmountInGrams = dailyAmount;
    if (data.wetDailyAmountUnit === 'oz') {
        dailyAmountInGrams = dailyAmount * 28.3495; // oz to grams
    }
    if (dailyAmountInGrams >= totalWeightInGrams) {
        ctx.addIssue({
            code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodIssueCode.custom,
            message: 'Daily amount should be less than total weight',
            path: [
                'dailyAmount'
            ]
        });
    }
});
const updateDryFoodSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    brandName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(100).optional(),
    productName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(150).optional(),
    bagWeight: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().refine((val)=>{
        if (!val) return true; // Allow empty for partial updates
        const num = parseFloat(val.replace(',', '.'));
        return !isNaN(num) && num > 0;
    }, 'Bag weight must be a positive number').optional(),
    bagWeightUnit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'kg',
        'pounds'
    ]).optional(),
    dailyAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().refine((val)=>{
        if (!val) return true;
        const num = parseFloat(val.replace(',', '.'));
        return !isNaN(num) && num > 0;
    }, 'Daily amount must be a positive number').optional(),
    dryDailyAmountUnit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'grams'
    ]).optional(),
    dateStarted: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().refine((val)=>{
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date <= new Date();
    }, 'Invalid date or date cannot be in the future').optional()
});
const updateWetFoodSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    brandName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(100).optional(),
    productName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(150).optional(),
    numberOfUnits: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Number of units is required').refine((val)=>{
        const num = parseInt(val, 10);
        return !isNaN(num) && Number.isInteger(num) && num > 0;
    }, 'Number of units must be a positive whole number').optional(),
    weightPerUnit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().refine((val)=>{
        if (!val) return true;
        const num = parseFloat(val.replace(',', '.'));
        return !isNaN(num) && num > 0;
    }, 'Weight per unit must be a positive number').optional(),
    wetWeightUnit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'grams',
        'oz'
    ]).optional(),
    dailyAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().refine((val)=>{
        if (!val) return true;
        const num = parseFloat(val.replace(',', '.'));
        return !isNaN(num) && num > 0;
    }, 'Daily amount must be a positive number').optional(),
    wetDailyAmountUnit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'grams',
        'oz'
    ]).optional(),
    dateStarted: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$dist$2f$esm$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().refine((val)=>{
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date <= new Date();
    }, 'Invalid date or date cannot be in the future').optional()
});
function validateDryFoodData(data) {
    const result = dryFoodSchema.safeParse(data);
    if (!result.success) {
        const errorMessage = result.error.errors.map((err)=>err.message).join(', ');
        throw new Error(`Dry food validation failed: ${errorMessage}`);
    }
    return result.data;
}
function validateWetFoodData(data) {
    const result = wetFoodSchema.safeParse(data);
    if (!result.success) {
        const errorMessage = result.error.errors.map((err)=>err.message).join(', ');
        throw new Error(`Wet food validation failed: ${errorMessage}`);
    }
    return result.data;
}
function validateUpdateDryFoodData(data) {
    const result = updateDryFoodSchema.safeParse(data);
    if (!result.success) {
        const errorMessage = result.error.errors.map((err)=>err.message).join(', ');
        throw new Error(`Dry food update validation failed: ${errorMessage}`);
    }
    return result.data;
}
function validateUpdateWetFoodData(data) {
    const result = updateWetFoodSchema.safeParse(data);
    if (!result.success) {
        const errorMessage = result.error.errors.map((err)=>err.message).join(', ');
        throw new Error(`Wet food update validation failed: ${errorMessage}`);
    }
    return result.data;
}
const formatDateForDisplay = (dateString)=>{
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};
}}),
"[project]/apps/web/src/lib/utils/food-formatting.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "calculateExpectedDays": (()=>calculateExpectedDays),
    "formatFeedingStatusMessage": (()=>formatFeedingStatusMessage),
    "formatRemainingWeight": (()=>formatRemainingWeight),
    "formatVariancePercentage": (()=>formatVariancePercentage),
    "getFeedingStatusColor": (()=>getFeedingStatusColor),
    "getFeedingStatusIcon": (()=>getFeedingStatusIcon),
    "getFeedingStatusLabel": (()=>getFeedingStatusLabel)
});
function formatVariancePercentage(variance) {
    const sign = variance > 0 ? '+' : '';
    return `${sign}${variance.toFixed(1)}%`;
}
function getFeedingStatusColor(status) {
    switch(status){
        case 'overfeeding':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'slightly-over':
            return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'underfeeding':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'slightly-under':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'normal':
            return 'bg-green-100 text-green-800 border-green-200';
    }
}
function getFeedingStatusLabel(status) {
    switch(status){
        case 'overfeeding':
            return 'Overfeeding';
        case 'slightly-over':
            return 'Slightly Overfeeding';
        case 'underfeeding':
            return 'Underfeeding';
        case 'slightly-under':
            return 'Slightly Underfeeding';
        case 'normal':
            return 'Normal';
    }
}
function getFeedingStatusIcon(status) {
    switch(status){
        case 'overfeeding':
            return '🔴';
        case 'slightly-over':
            return '🟠';
        case 'underfeeding':
            return '🔴';
        case 'slightly-under':
            return '🟡';
        case 'normal':
            return '🟢';
    }
}
function calculateExpectedDays(entry) {
    if (entry.foodType === 'dry') {
        const dryEntry = entry;
        const totalWeightGrams = parseFloat(dryEntry.bagWeight) * (dryEntry.bagWeightUnit === 'kg' ? 1000 : 453.592);
        const dailyAmountGrams = parseFloat(dryEntry.dailyAmount);
        return Math.ceil(totalWeightGrams / dailyAmountGrams);
    } else {
        const wetEntry = entry;
        const totalWeightGrams = wetEntry.numberOfUnits * parseFloat(wetEntry.weightPerUnit) * (wetEntry.wetWeightUnit === 'oz' ? 28.3495 : 1);
        const dailyAmountGrams = parseFloat(wetEntry.dailyAmount) * (wetEntry.wetDailyAmountUnit === 'oz' ? 28.3495 : 1);
        return Math.ceil(totalWeightGrams / dailyAmountGrams);
    }
}
function formatFeedingStatusMessage(entry) {
    if (!entry.actualDaysElapsed || !entry.feedingStatus) {
        return '';
    }
    const expectedDays = calculateExpectedDays(entry);
    const daysDifference = Math.abs(entry.actualDaysElapsed - expectedDays);
    const statusLabel = getFeedingStatusLabel(entry.feedingStatus);
    const icon = getFeedingStatusIcon(entry.feedingStatus);
    if (entry.feedingStatus === 'overfeeding' || entry.feedingStatus === 'slightly-over') {
        return `${icon} ${statusLabel} by ~${daysDifference} day${daysDifference !== 1 ? 's' : ''}`;
    } else if (entry.feedingStatus === 'underfeeding' || entry.feedingStatus === 'slightly-under') {
        return `${icon} ${statusLabel} by ${daysDifference} day${daysDifference !== 1 ? 's' : ''}`;
    } else {
        return `${icon} ${statusLabel}`;
    }
}
function formatRemainingWeight(weight) {
    if (weight < 0.1) {
        return weight.toFixed(3).replace(/\.?0+$/, '');
    } else if (weight < 1) {
        return weight.toFixed(2).replace(/\.?0+$/, '');
    } else {
        return weight.toFixed(1).replace(/\.?0+$/, '');
    }
}
}}),
"[project]/apps/web/src/lib/api/domains/food/service.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "FoodService": (()=>FoodService)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/errors.ts [app-ssr] (ecmascript)");
;
class FoodService {
    repository;
    validator;
    constructor(repository, validator){
        this.repository = repository;
        this.validator = validator;
    }
    // Dry food methods
    async getDryFoodEntries(petId) {
        try {
            this.validator.validatePetId(petId);
            return await this.repository.getDryFoodEntries(petId);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    async getDryFoodEntryById(petId, foodId) {
        try {
            this.validator.validatePetId(petId);
            this.validator.validateFoodId(foodId);
            return await this.repository.getDryFoodEntryById(petId, foodId);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    async createDryFoodEntry(petId, foodData) {
        try {
            this.validator.validatePetId(petId);
            const validatedData = this.validator.validateDryFoodData(foodData);
            return await this.repository.createDryFoodEntry(petId, validatedData);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    async updateDryFoodEntry(petId, foodId, foodData) {
        try {
            this.validator.validatePetId(petId);
            this.validator.validateFoodId(foodId);
            const validatedData = this.validator.validateUpdateDryFoodData(foodData);
            return await this.repository.updateDryFoodEntry(petId, foodId, validatedData);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    async getFinishedDryFoodEntries(petId, limit = 10) {
        try {
            this.validator.validatePetId(petId);
            return await this.repository.getFinishedDryFoodEntries(petId, limit);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    // Wet food methods
    async getWetFoodEntries(petId) {
        try {
            this.validator.validatePetId(petId);
            return await this.repository.getWetFoodEntries(petId);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    async getWetFoodEntryById(petId, foodId) {
        try {
            this.validator.validatePetId(petId);
            this.validator.validateFoodId(foodId);
            return await this.repository.getWetFoodEntryById(petId, foodId);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    async createWetFoodEntry(petId, foodData) {
        try {
            this.validator.validatePetId(petId);
            const validatedData = this.validator.validateWetFoodData(foodData);
            return await this.repository.createWetFoodEntry(petId, validatedData);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    async updateWetFoodEntry(petId, foodId, foodData) {
        try {
            this.validator.validatePetId(petId);
            this.validator.validateFoodId(foodId);
            const validatedData = this.validator.validateUpdateWetFoodData(foodData);
            return await this.repository.updateWetFoodEntry(petId, foodId, validatedData);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    async getFinishedWetFoodEntries(petId, limit = 10) {
        try {
            this.validator.validatePetId(petId);
            return await this.repository.getFinishedWetFoodEntries(petId, limit);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    // Combined methods
    async getAllFoodEntries(petId) {
        try {
            this.validator.validatePetId(petId);
            return await this.repository.getAllFoodEntries(petId);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    async deleteFoodEntry(petId, foodId) {
        try {
            this.validator.validatePetId(petId);
            this.validator.validateFoodId(foodId);
            return await this.repository.deleteFoodEntry(petId, foodId);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    async markFoodAsFinished(petId, foodId) {
        try {
            this.validator.validatePetId(petId);
            this.validator.validateFoodId(foodId);
            return await this.repository.markFoodAsFinished(petId, foodId);
        } catch (error) {
            throw this.handleError(error);
        }
    }
    //Error handling
    handleError(error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiError"]) {
            return error;
        }
        if (error instanceof Error) {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiError"](error.message, 500, 'FOOD_ERROR');
        }
        return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiError"]('An unexpected error occurred', 500, 'FOOD_ERROR');
    }
    mapError(error) {
        let message = 'An error occurred while processing your request';
        let field;
        let code = 'FOOD_ERROR';
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ValidationError"]) {
            message = error.message;
            field = error.field;
            code = 'VALIDATION_ERROR';
        } else if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NotFoundError"]) {
            message = 'Food entry not found';
            code = 'NOT_FOUND';
        } else if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UnauthorizedError"]) {
            message = 'You must be logged in to perform this action';
            code = 'UNAUTHORIZED';
        } else if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ForbiddenError"]) {
            message = 'You do not have permission to perform this action';
            code = 'FORBIDDEN';
        } else if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ApiError"]) {
            message = error.message;
            code = error.code || 'API_ERROR';
        } else if (error instanceof Error) {
            message = error.message;
        }
        return {
            message,
            field,
            code
        };
    }
}
}}),
"[project]/apps/web/src/lib/api/domains/food/repository.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "FoodRepository": (()=>FoodRepository),
    "foodRepository": (()=>foodRepository)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/base.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/base.ts [app-ssr] (ecmascript) <locals>");
;
class FoodRepository {
    // Dry food methods
    async getDryFoodEntries(petId) {
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["get"])(`/api/pets/${petId}/food/dry`);
    }
    async getDryFoodEntryById(petId, foodId) {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["get"])(`/api/pets/${petId}/food/dry/${foodId}`);
        return result.foodEntry;
    }
    async createDryFoodEntry(petId, foodData) {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["post"])(`/api/pets/${petId}/food/dry`, foodData);
        return result.foodEntry;
    }
    async updateDryFoodEntry(petId, foodId, foodData) {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["put"])(`/api/pets/${petId}/food/dry/${foodId}`, foodData);
        return result.foodEntry;
    }
    async getFinishedDryFoodEntries(petId, limit = 10) {
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["get"])(`/api/pets/${petId}/food/finished`, {
            foodType: 'dry',
            limit
        });
    }
    // Wet food methods
    async getWetFoodEntries(petId) {
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["get"])(`/api/pets/${petId}/food/wet`);
    }
    async getWetFoodEntryById(petId, foodId) {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["get"])(`/api/pets/${petId}/food/wet/${foodId}`);
        return result.foodEntry;
    }
    async createWetFoodEntry(petId, foodData) {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["post"])(`/api/pets/${petId}/food/wet`, foodData);
        return result.foodEntry;
    }
    async updateWetFoodEntry(petId, foodId, foodData) {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["put"])(`/api/pets/${petId}/food/wet/${foodId}`, foodData);
        return result.foodEntry;
    }
    async getFinishedWetFoodEntries(petId, limit = 10) {
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["get"])(`/api/pets/${petId}/food/finished`, {
            foodType: 'wet',
            limit
        });
    }
    // Combined methods
    async getAllFoodEntries(petId) {
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["get"])(`/api/pets/${petId}/food`);
    }
    async deleteFoodEntry(petId, foodId) {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["del"])(`/api/pets/${petId}/food/${foodId}`);
    }
    async markFoodAsFinished(petId, foodId) {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["patch"])(`/api/pets/${petId}/food/${foodId}/finish`);
        return result.foodEntry;
    }
    async updateFinishDate(petId, foodId, dateFinished) {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["put"])(`/api/pets/${petId}/food/${foodId}/finish-date`, {
            dateFinished
        });
        return result.foodEntry;
    }
}
const foodRepository = new FoodRepository();
}}),
"[project]/apps/web/src/lib/api/domains/food/validator.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "FoodValidator": (()=>FoodValidator),
    "foodValidator": (()=>foodValidator)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$validations$2f$food$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/validations/food.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/errors.ts [app-ssr] (ecmascript)");
;
;
class FoodValidator {
    validateDryFoodData(data) {
        try {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$validations$2f$food$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateDryFoodData"])(data);
        } catch (error) {
            if (error instanceof Error) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ValidationError"](error.message, 'validation');
            }
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ValidationError"]('Dry food validation failed', 'validation');
        }
    }
    validateWetFoodData(data) {
        try {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$validations$2f$food$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateWetFoodData"])(data);
        } catch (error) {
            if (error instanceof Error) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ValidationError"](error.message, 'validation');
            }
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ValidationError"]('Wet food validation failed', 'validation');
        }
    }
    validateUpdateDryFoodData(data) {
        try {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$validations$2f$food$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateUpdateDryFoodData"])(data);
        } catch (error) {
            if (error instanceof Error) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ValidationError"](error.message, 'validation');
            }
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ValidationError"]('Dry food update validation failed', 'validation');
        }
    }
    validateUpdateWetFoodData(data) {
        try {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$validations$2f$food$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateUpdateWetFoodData"])(data);
        } catch (error) {
            if (error instanceof Error) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ValidationError"](error.message, 'validation');
            }
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ValidationError"]('Wet food update validation failed', 'validation');
        }
    }
    validateFoodId(foodId) {
        if (!foodId || typeof foodId !== 'string' || foodId.trim().length === 0) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ValidationError"]('Valid food ID is required', 'foodId');
        }
        return foodId.trim();
    }
    validatePetId(petId) {
        if (!petId || typeof petId !== 'string' || petId.trim().length === 0) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$errors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ValidationError"]('Valid pet ID is required', 'petId');
        }
        return petId.trim();
    }
}
const foodValidator = new FoodValidator();
}}),
"[project]/apps/web/src/lib/api/domains/food/index.ts [app-ssr] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "dryFoodApi": (()=>dryFoodApi),
    "foodApi": (()=>foodApi),
    "foodErrorHandler": (()=>foodErrorHandler),
    "wetFoodApi": (()=>wetFoodApi)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/food/service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$repository$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/food/repository.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$validator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/food/validator.ts [app-ssr] (ecmascript)");
;
;
;
const foodService = new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FoodService"](__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$repository$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["foodRepository"], __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$validator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["foodValidator"]);
const dryFoodApi = {
    getDryFoodEntries: (petId)=>foodService.getDryFoodEntries(petId),
    getFinishedDryFoodEntries: (petId, limit)=>foodService.getFinishedDryFoodEntries(petId, limit),
    createDryFoodEntry: (petId, foodData)=>foodService.createDryFoodEntry(petId, foodData),
    updateDryFoodEntry: (petId, foodId, foodData)=>foodService.updateDryFoodEntry(petId, foodId, foodData)
};
const wetFoodApi = {
    getWetFoodEntries: (petId)=>foodService.getWetFoodEntries(petId),
    getFinishedWetFoodEntries: (petId, limit)=>foodService.getFinishedWetFoodEntries(petId, limit),
    createWetFoodEntry: (petId, foodData)=>foodService.createWetFoodEntry(petId, foodData),
    updateWetFoodEntry: (petId, foodId, foodData)=>foodService.updateWetFoodEntry(petId, foodId, foodData)
};
const foodApi = {
    getAllFoodEntries: (petId)=>foodService.getAllFoodEntries(petId),
    deleteFoodEntry: (petId, foodId)=>foodService.deleteFoodEntry(petId, foodId),
    markFoodAsFinished: (petId, foodId)=>foodService.markFoodAsFinished(petId, foodId),
    updateFinishDate: (petId, foodId, dateFinished)=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$repository$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["foodRepository"].updateFinishDate(petId, foodId, dateFinished)
};
const foodErrorHandler = (error)=>foodService.mapError(error);
;
;
;
}}),
"[project]/apps/web/src/lib/api/domains/food/index.ts [app-ssr] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/food/service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$repository$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/food/repository.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$validator$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/food/validator.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/food/index.ts [app-ssr] (ecmascript) <locals>");
}}),
"[project]/apps/web/src/hooks/usePets.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "usePets": (()=>usePets)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$pets$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/pets.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$hooks$2f$useErrorsState$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/hooks/useErrorsState.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/toast.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/toast.ts [app-ssr] (ecmascript) <locals>");
;
;
;
;
function usePets() {
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        pets: [],
        isLoading: true,
        error: null
    });
    const { executeAction } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$hooks$2f$useErrorsState$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useErrorState"])();
    // Load all pets
    const loadPets = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        setState((prev)=>({
                ...prev,
                isLoading: true,
                error: null
            }));
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$pets$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["petApi"].getPets();
            setState({
                pets: response.pets,
                isLoading: false,
                error: null
            });
        } catch (error) {
            const petError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$pets$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["petErrorHandler"])(error);
            setState({
                pets: [],
                isLoading: false,
                error: petError.message
            });
        }
    }, []);
    // Public refresh function
    const refreshPets = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        await loadPets();
    }, [
        loadPets
    ]);
    // Create a new pet
    const createPet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (petData)=>{
        const result = await executeAction(async ()=>{
            const transformedData = {
                ...petData,
                weight: petData.weight ? petData.weight.replace(',', '.') : ''
            };
            const newPet = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$pets$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["petApi"].createPet(transformedData);
            // Update local state by adding the new pet
            setState((prev)=>({
                    ...prev,
                    pets: [
                        newPet,
                        ...prev.pets
                    ]
                }));
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Pet created', `${newPet.name} has been added to your pets!`);
            return newPet;
        }, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$pets$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["petErrorHandler"]);
        return result;
    }, [
        executeAction
    ]);
    // Update an existing pet
    const updatePet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (petId, petData)=>{
        const result = await executeAction(async ()=>{
            const transformedData = {
                ...petData,
                weight: petData.weight ? petData.weight.replace(',', '.') : ''
            };
            const updatedPet = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$pets$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["petApi"].updatePet(petId, transformedData);
            // Update local state
            setState((prev)=>({
                    ...prev,
                    pets: prev.pets.map((pet)=>pet.id === petId ? updatedPet : pet)
                }));
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Pet updated', `${updatedPet.name}'s information has been updated!`);
            return updatedPet;
        }, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$pets$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["petErrorHandler"]);
        return result;
    }, [
        executeAction
    ]);
    // Delete a pet (soft delete)
    const deletePet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (petId)=>{
        const petToDelete = state.pets.find((p)=>p.id === petId);
        const petName = petToDelete?.name || 'Pet';
        const result = await executeAction(async ()=>{
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$pets$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["petApi"].deletePet(petId);
            // Update local state by removing the pet
            setState((prev)=>({
                    ...prev,
                    pets: prev.pets.filter((pet)=>pet.id !== petId)
                }));
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Pet deleted', `${petName} has been removed from your pets.`);
            return true;
        }, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$pets$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["petErrorHandler"]);
        return result || false;
    }, [
        executeAction,
        state.pets
    ]);
    // Get a specific pet by ID
    const getPetById = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((petId)=>{
        return state.pets.find((pet)=>pet.id === petId);
    }, [
        state.pets
    ]);
    // Load pets on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        loadPets();
    }, [
        loadPets
    ]);
    return {
        ...state,
        refreshPets,
        createPet,
        updatePet,
        deletePet,
        getPetById
    };
}
}}),
"[project]/apps/web/src/hooks/usePetForm.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "usePetForm": (()=>usePetForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-hook-form/dist/index.esm.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$hookform$2f$resolvers$2f$zod$2f$dist$2f$zod$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@hookform/resolvers/zod/dist/zod.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$validations$2f$pet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/validations/pet.ts [app-ssr] (ecmascript)");
;
;
;
function usePetForm(options = {}) {
    const { defaultValues, pet } = options;
    // Convert Pet data to form data if editing
    const getInitialValues = ()=>{
        if (pet) {
            return {
                name: pet.name,
                animalType: pet.animalType,
                species: pet.species || '',
                gender: pet.gender,
                birthDate: pet.birthDate || '',
                weight: pet.weight ?? '',
                weightUnit: pet.weightUnit,
                isNeutered: pet.isNeutered,
                microchipNumber: pet.microchipNumber || '',
                notes: pet.notes || ''
            };
        }
        return {
            name: '',
            animalType: 'cat',
            species: '',
            gender: 'unknown',
            birthDate: '',
            weight: '',
            weightUnit: 'kg',
            isNeutered: false,
            microchipNumber: '',
            notes: '',
            ...defaultValues
        };
    };
    const form = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useForm"])({
        resolver: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$hookform$2f$resolvers$2f$zod$2f$dist$2f$zod$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["zodResolver"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$validations$2f$pet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["petFormSchema"]),
        defaultValues: getInitialValues()
    });
    // Reset form with new data (useful for switching between pets)
    const resetWithPet = (newPet)=>{
        const formData = {
            name: newPet.name,
            animalType: newPet.animalType,
            species: newPet.species || '',
            gender: newPet.gender,
            birthDate: newPet.birthDate || '',
            weight: newPet.weight || '',
            weightUnit: newPet.weightUnit,
            isNeutered: newPet.isNeutered,
            microchipNumber: newPet.microchipNumber || '',
            notes: newPet.notes || ''
        };
        form.reset(formData);
    };
    // Reset to empty form
    const resetToEmpty = ()=>{
        form.reset(getInitialValues());
    };
    return {
        ...form,
        resetWithPet,
        resetToEmpty
    };
}
}}),
"[project]/apps/web/src/hooks/useWeightTracker.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "useWeightTracker": (()=>useWeightTracker)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/weights/index.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/weights/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$validations$2f$weight$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/validations/weight.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/toast.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/toast.ts [app-ssr] (ecmascript) <locals>");
;
;
;
;
function useWeightTracker({ petId, weightUnit }) {
    const [weightEntries, setWeightEntries] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const fetchWeightEntries = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!petId) return;
        try {
            setIsLoading(true);
            setError(null);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["weightApi"].getWeightEntries(petId);
            setWeightEntries(response.weightEntries);
        } catch (err) {
            const weightError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["weightErrorHandler"])(err);
            setError(weightError.message);
            console.error('Failed to fetch weight entries:', err);
        } finally{
            setIsLoading(false);
        }
    }, [
        petId
    ]);
    const createWeightEntry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (weightData)=>{
        try {
            const newEntry = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["weightApi"].createWeightEntry(petId, weightData, weightUnit);
            // Update local state optimistically
            setWeightEntries((prev)=>[
                    ...prev,
                    newEntry
                ]);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Weight entry added successfully');
            return newEntry;
        } catch (err) {
            const weightError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["weightErrorHandler"])(err);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].error(weightError.message);
            console.error('Failed to create weight entry:', err);
            return null;
        }
    }, [
        petId,
        weightUnit
    ]);
    const updateWeightEntry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (weightId, weightData)=>{
        try {
            const updatedEntry = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["weightApi"].updateWeightEntry(petId, weightId, weightData, weightUnit);
            // Update local state
            setWeightEntries((prev)=>prev.map((entry)=>entry.id === weightId ? updatedEntry : entry));
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Weight entry updated successfully');
            return updatedEntry;
        } catch (err) {
            const weightError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["weightErrorHandler"])(err);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].error(weightError.message);
            console.error('Failed to update weight entry:', err);
            return null;
        }
    }, [
        petId,
        weightUnit
    ]);
    const deleteWeightEntry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (weightId)=>{
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["weightApi"].deleteWeightEntry(petId, weightId);
            // Update local state
            setWeightEntries((prev)=>prev.filter((entry)=>entry.id !== weightId));
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Weight entry deleted successfully');
            return true;
        } catch (err) {
            const weightError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$weights$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["weightErrorHandler"])(err);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].error(weightError.message);
            console.error('Failed to delete weight entry:', err);
            return false;
        }
    }, [
        petId
    ]);
    // Get sorted weight entries (oldest to newest for chart)
    const sortedWeightEntries = weightEntries.sort((a, b)=>new Date(a.date).getTime() - new Date(b.date).getTime());
    // Convert to chart data format
    const chartData = sortedWeightEntries.map((entry)=>({
            date: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$validations$2f$weight$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDateForDisplay"])(entry.date),
            weight: parseFloat(entry.weight),
            originalDate: entry.date
        }));
    const latestWeight = sortedWeightEntries.length > 0 ? sortedWeightEntries[sortedWeightEntries.length - 1] : null;
    // Fetch data on mount and when petId changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        fetchWeightEntries();
    }, [
        fetchWeightEntries
    ]);
    return {
        // Data
        weightEntries: sortedWeightEntries,
        chartData,
        latestWeight,
        // State
        isLoading,
        error,
        // Actions
        createWeightEntry,
        updateWeightEntry,
        deleteWeightEntry,
        refetchWeightEntries: fetchWeightEntries
    };
}
}}),
"[project]/apps/web/src/hooks/useWeightForm.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "useWeightForm": (()=>useWeightForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-hook-form/dist/index.esm.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$hookform$2f$resolvers$2f$zod$2f$dist$2f$zod$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@hookform/resolvers/zod/dist/zod.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$validations$2f$weight$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/validations/weight.ts [app-ssr] (ecmascript)");
;
;
;
function useWeightForm(options) {
    const { weightUnit, weightEntry, defaultValues } = options;
    const schema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$validations$2f$weight$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createWeightEntrySchema"])(weightUnit);
    const getInitialValues = ()=>{
        if (weightEntry) {
            return {
                weight: weightEntry.weight,
                date: weightEntry.date
            };
        }
        return {
            weight: '',
            date: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$validations$2f$weight$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTodayDateString"])(),
            ...defaultValues
        };
    };
    const form = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useForm"])({
        resolver: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$hookform$2f$resolvers$2f$zod$2f$dist$2f$zod$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["zodResolver"])(schema),
        defaultValues: getInitialValues()
    });
    const resetWithWeightEntry = (newWeightEntry)=>{
        const formData = {
            weight: newWeightEntry.weight,
            date: newWeightEntry.date
        };
        form.reset(formData);
    };
    const resetToEmpty = ()=>{
        form.reset({
            weight: '',
            date: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$validations$2f$weight$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTodayDateString"])(),
            ...defaultValues
        });
    };
    return {
        ...form,
        resetWithWeightEntry,
        resetToEmpty
    };
}
}}),
"[project]/apps/web/src/hooks/useDryFoodTracker.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "useDryFoodTracker": (()=>useDryFoodTracker)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/food/index.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/food/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/toast.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/toast.ts [app-ssr] (ecmascript) <locals>");
;
;
;
function useDryFoodTracker({ petId }) {
    console.log('🔴 useDryFoodTracker HOOK CALLED with petId:', petId);
    // Separate state for active and finished entries
    const [activeDryFoodEntries, setActiveDryFoodEntries] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [finishedDryFoodEntries, setFinishedDryFoodEntries] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Fetch active entries
    const fetchActiveDryFoodEntries = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!petId) return;
        try {
            setError(null);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["dryFoodApi"].getDryFoodEntries(petId);
            setActiveDryFoodEntries(response.foodEntries);
        } catch (err) {
            const foodError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodErrorHandler"])(err);
            setError(foodError.message);
            console.error('Failed to fetch active dry food entries:', err);
        }
    }, [
        petId
    ]);
    // Fetch finished entries
    const fetchFinishedDryFoodEntries = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!petId) return;
        try {
            setError(null);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["dryFoodApi"].getFinishedDryFoodEntries(petId);
            // Sort by dateFinished DESC (most recent first) as a safety measure
            const sortedEntries = [
                ...response.foodEntries
            ].sort((a, b)=>{
                if (!a.dateFinished || !b.dateFinished) return 0;
                return new Date(b.dateFinished).getTime() - new Date(a.dateFinished).getTime();
            });
            setFinishedDryFoodEntries(sortedEntries);
        } catch (err) {
            const foodError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodErrorHandler"])(err);
            setError(foodError.message);
            console.error('Failed to fetch finished dry food entries:', err);
        }
    }, [
        petId
    ]);
    // Fetch both on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        console.log('🔴 DRY useEffect TRIGGERED for petId:', petId);
        // Reset state immediately when petId changes to prevent stale data
        setActiveDryFoodEntries([]);
        setFinishedDryFoodEntries([]);
        setError(null);
        const fetchAllData = async ()=>{
            console.log('🔴 DRY FETCHING DATA for petId:', petId);
            setIsLoading(true);
            await Promise.all([
                fetchActiveDryFoodEntries(),
                fetchFinishedDryFoodEntries()
            ]);
            console.log('🔴 DRY FETCH COMPLETE for petId:', petId, 'Active entries:', activeDryFoodEntries.length);
            setIsLoading(false);
        };
        fetchAllData();
    }, [
        fetchActiveDryFoodEntries,
        fetchFinishedDryFoodEntries
    ]);
    const createDryFoodEntry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (foodData)=>{
        try {
            const newEntry = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["dryFoodApi"].createDryFoodEntry(petId, foodData);
            // Optimistically add to active entries
            setActiveDryFoodEntries((prev)=>[
                    newEntry,
                    ...prev
                ]);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Dry food entry added successfully');
            return newEntry;
        } catch (err) {
            const foodError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodErrorHandler"])(err);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].error(foodError.message);
            console.error('Failed to create dry food entry:', err);
            return null;
        }
    }, [
        petId
    ]);
    const updateDryFoodEntry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (foodId, foodData)=>{
        try {
            const updatedEntry = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["dryFoodApi"].updateDryFoodEntry(petId, foodId, foodData);
            // Optimistically update in active entries
            setActiveDryFoodEntries((prev)=>prev.map((entry)=>entry.id === foodId ? {
                        ...updatedEntry
                    } : entry));
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Dry food entry updated successfully');
            return updatedEntry;
        } catch (err) {
            const foodError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodErrorHandler"])(err);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].error(foodError.message);
            console.error('Failed to update dry food entry:', err);
            return null;
        }
    }, [
        petId
    ]);
    const deleteDryFoodEntry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (foodId)=>{
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodApi"].deleteFoodEntry(petId, foodId);
            // Remove from whichever state has it
            setActiveDryFoodEntries((prev)=>prev.filter((entry)=>entry.id !== foodId));
            setFinishedDryFoodEntries((prev)=>prev.filter((entry)=>entry.id !== foodId));
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Dry food entry deleted successfully');
            return true;
        } catch (err) {
            const foodError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodErrorHandler"])(err);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].error(foodError.message);
            console.error('Failed to delete dry food entry:', err);
            return false;
        }
    }, [
        petId
    ]);
    const markDryFoodAsFinished = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (foodId)=>{
        try {
            const finishedEntry = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodApi"].markFoodAsFinished(petId, foodId);
            // Move from active to finished
            setActiveDryFoodEntries((prev)=>prev.filter((entry)=>entry.id !== foodId));
            setFinishedDryFoodEntries((prev)=>[
                    finishedEntry,
                    ...prev
                ]);
            // Enhanced toast with consumption info
            if (finishedEntry.actualDaysElapsed && finishedEntry.feedingStatus) {
                const dryEntry = finishedEntry;
                const totalWeightGrams = parseFloat(dryEntry.bagWeight) * (dryEntry.bagWeightUnit === 'kg' ? 1000 : 453.592);
                const dailyAmountGrams = parseFloat(dryEntry.dailyAmount);
                const expectedDays = Math.ceil(totalWeightGrams / dailyAmountGrams);
                const statusLabel = finishedEntry.feedingStatus === 'overfeeding' ? 'Overfeeding' : finishedEntry.feedingStatus === 'slightly-over' ? 'Slightly Over' : finishedEntry.feedingStatus === 'underfeeding' ? 'Underfeeding' : finishedEntry.feedingStatus === 'slightly-under' ? 'Slightly Under' : 'Normal feeding';
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success(`✅ Finished! Consumed in ${finishedEntry.actualDaysElapsed} days (expected ${expectedDays} days). Status: ${statusLabel}`);
            } else {
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Dry food marked as finished');
            }
            return true;
        } catch (err) {
            const foodError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodErrorHandler"])(err);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].error(foodError.message);
            console.error('Failed to mark dry food as finished:', err);
            return false;
        }
    }, [
        petId
    ]);
    const updateFinishDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (foodId, dateFinished)=>{
        try {
            const updatedEntry = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodApi"].updateFinishDate(petId, foodId, dateFinished);
            // Update in finished entries and maintain sort order
            setFinishedDryFoodEntries((prev)=>{
                const updated = prev.map((entry)=>entry.id === foodId ? {
                        ...updatedEntry
                    } : entry);
                // Re-sort by dateFinished DESC after update
                return updated.sort((a, b)=>{
                    if (!a.dateFinished || !b.dateFinished) return 0;
                    return new Date(b.dateFinished).getTime() - new Date(a.dateFinished).getTime();
                });
            });
            // Enhanced toast with consumption info
            if (updatedEntry.actualDaysElapsed && updatedEntry.feedingStatus) {
                const dryEntry = updatedEntry;
                const totalWeightGrams = parseFloat(dryEntry.bagWeight) * (dryEntry.bagWeightUnit === 'kg' ? 1000 : 453.592);
                const dailyAmountGrams = parseFloat(dryEntry.dailyAmount);
                const expectedDays = Math.ceil(totalWeightGrams / dailyAmountGrams);
                const statusLabel = updatedEntry.feedingStatus === 'overfeeding' ? 'Overfeeding' : updatedEntry.feedingStatus === 'slightly-over' ? 'Slightly Over' : updatedEntry.feedingStatus === 'underfeeding' ? 'Underfeeding' : updatedEntry.feedingStatus === 'slightly-under' ? 'Slightly Under' : 'Normal feeding';
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success(`✅ Finished! Consumed in ${updatedEntry.actualDaysElapsed} days (expected ${expectedDays} days). Status: ${statusLabel}`);
            } else {
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Finish date updated successfully');
            }
            return updatedEntry;
        } catch (err) {
            const foodError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodErrorHandler"])(err);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].error(foodError.message);
            console.error('Failed to update finish date:', err);
            return null;
        }
    }, [
        petId
    ]);
    // Calculate low stock from active entries
    const lowStockDryFoodEntries = activeDryFoodEntries.filter((entry)=>entry.remainingDays !== undefined && entry.remainingDays <= 7 && entry.remainingDays > 0);
    return {
        activeDryFoodEntries,
        finishedDryFoodEntries,
        lowStockDryFoodEntries,
        isLoading,
        error,
        createDryFoodEntry,
        updateDryFoodEntry,
        deleteDryFoodEntry,
        markDryFoodAsFinished,
        updateFinishDate,
        refetchDryFoodEntries: async ()=>{
            await Promise.all([
                fetchActiveDryFoodEntries(),
                fetchFinishedDryFoodEntries()
            ]);
        }
    };
}
}}),
"[project]/apps/web/src/hooks/useWetFoodTracker.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "useWetFoodTracker": (()=>useWetFoodTracker)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/food/index.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/api/domains/food/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/toast.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/toast.ts [app-ssr] (ecmascript) <locals>");
;
;
;
function useWetFoodTracker({ petId }) {
    console.log('🔵 useWetFoodTracker HOOK CALLED with petId:', petId);
    // Separate state for active and finished entries
    const [activeWetFoodEntries, setActiveWetFoodEntries] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [finishedWetFoodEntries, setFinishedWetFoodEntries] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Fetch active entries
    const fetchActiveWetFoodEntries = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!petId) return;
        try {
            setError(null);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["wetFoodApi"].getWetFoodEntries(petId);
            setActiveWetFoodEntries(response.foodEntries);
        } catch (err) {
            const foodError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodErrorHandler"])(err);
            setError(foodError.message);
            console.error('Failed to fetch active wet food entries:', err);
        }
    }, [
        petId
    ]);
    // Fetch finished entries
    const fetchFinishedWetFoodEntries = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!petId) return;
        try {
            setError(null);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["wetFoodApi"].getFinishedWetFoodEntries(petId);
            // Sort by dateFinished DESC (most recent first)
            const sortedEntries = [
                ...response.foodEntries
            ].sort((a, b)=>{
                if (!a.dateFinished || !b.dateFinished) return 0;
                return new Date(b.dateFinished).getTime() - new Date(a.dateFinished).getTime();
            });
            setFinishedWetFoodEntries(sortedEntries);
        } catch (err) {
            const foodError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodErrorHandler"])(err);
            setError(foodError.message);
            console.error('Failed to fetch finished wet food entries:', err);
        }
    }, [
        petId
    ]);
    // Fetch both on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        console.log('🔵 WET useEffect TRIGGERED for petId:', petId);
        // Reset state immediately when petId changes to prevent stale data
        setActiveWetFoodEntries([]);
        setFinishedWetFoodEntries([]);
        setError(null);
        const fetchAllData = async ()=>{
            console.log('🔵 WET FETCHING DATA for petId:', petId);
            setIsLoading(true);
            await Promise.all([
                fetchActiveWetFoodEntries(),
                fetchFinishedWetFoodEntries()
            ]);
            console.log('🔵 WET FETCH COMPLETE for petId:', petId, 'Active entries:', activeWetFoodEntries.length);
            setIsLoading(false);
        };
        fetchAllData();
    }, [
        fetchActiveWetFoodEntries,
        fetchFinishedWetFoodEntries
    ]);
    const createWetFoodEntry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (foodData)=>{
        try {
            const newEntry = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["wetFoodApi"].createWetFoodEntry(petId, foodData);
            // Optimistically add to active entries
            setActiveWetFoodEntries((prev)=>[
                    newEntry,
                    ...prev
                ]);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Wet food entry added successfully');
            return newEntry;
        } catch (err) {
            const foodError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodErrorHandler"])(err);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].error(foodError.message);
            console.error('Failed to create wet food entry:', err);
            return null;
        }
    }, [
        petId
    ]);
    const updateWetFoodEntry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (foodId, foodData)=>{
        try {
            const updatedEntry = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["wetFoodApi"].updateWetFoodEntry(petId, foodId, foodData);
            // Optimistically update in active entries
            setActiveWetFoodEntries((prev)=>prev.map((entry)=>entry.id === foodId ? {
                        ...updatedEntry
                    } : entry));
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Wet food entry updated successfully');
            return updatedEntry;
        } catch (err) {
            const foodError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodErrorHandler"])(err);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].error(foodError.message);
            console.error('Failed to update wet food entry:', err);
            return null;
        }
    }, [
        petId
    ]);
    const deleteWetFoodEntry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (foodId)=>{
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodApi"].deleteFoodEntry(petId, foodId);
            // Remove from whichever state has it
            setActiveWetFoodEntries((prev)=>prev.filter((entry)=>entry.id !== foodId));
            setFinishedWetFoodEntries((prev)=>prev.filter((entry)=>entry.id !== foodId));
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Wet food entry deleted successfully');
            return true;
        } catch (err) {
            const foodError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodErrorHandler"])(err);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].error(foodError.message);
            console.error('Failed to delete wet food entry:', err);
            return false;
        }
    }, [
        petId
    ]);
    const markWetFoodAsFinished = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (foodId)=>{
        try {
            const finishedEntry = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodApi"].markFoodAsFinished(petId, foodId);
            // Move from active to finished
            setActiveWetFoodEntries((prev)=>prev.filter((entry)=>entry.id !== foodId));
            setFinishedWetFoodEntries((prev)=>[
                    finishedEntry,
                    ...prev
                ]);
            // Enhanced toast with consumption info
            if (finishedEntry.actualDaysElapsed && finishedEntry.feedingStatus) {
                const wetEntry = finishedEntry;
                const totalWeightGrams = wetEntry.numberOfUnits * parseFloat(wetEntry.weightPerUnit) * (wetEntry.wetWeightUnit === 'oz' ? 28.3495 : 1);
                const dailyAmountGrams = parseFloat(wetEntry.dailyAmount) * (wetEntry.wetDailyAmountUnit === 'oz' ? 28.3495 : 1);
                const expectedDays = Math.ceil(totalWeightGrams / dailyAmountGrams);
                const statusLabel = finishedEntry.feedingStatus === 'overfeeding' ? 'Overfeeding' : finishedEntry.feedingStatus === 'slightly-over' ? 'Slightly Over' : finishedEntry.feedingStatus === 'underfeeding' ? 'Underfeeding' : finishedEntry.feedingStatus === 'slightly-under' ? 'Slightly Under' : 'Normal feeding';
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success(`✅ Finished! Consumed in ${finishedEntry.actualDaysElapsed} days (expected ${expectedDays} days). Status: ${statusLabel}`);
            } else {
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Wet food marked as finished');
            }
            return true;
        } catch (err) {
            const foodError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodErrorHandler"])(err);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].error(foodError.message);
            console.error('Failed to mark wet food as finished:', err);
            return false;
        }
    }, [
        petId
    ]);
    const updateFinishDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (foodId, dateFinished)=>{
        try {
            const updatedEntry = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodApi"].updateFinishDate(petId, foodId, dateFinished);
            // Update in finished entries and maintain sort order
            setFinishedWetFoodEntries((prev)=>{
                const updated = prev.map((entry)=>entry.id === foodId ? {
                        ...updatedEntry
                    } : entry);
                // Re-sort by dateFinished DESC after update
                return updated.sort((a, b)=>{
                    if (!a.dateFinished || !b.dateFinished) return 0;
                    return new Date(b.dateFinished).getTime() - new Date(a.dateFinished).getTime();
                });
            });
            // Enhanced toast with consumption info
            if (updatedEntry.actualDaysElapsed && updatedEntry.feedingStatus) {
                const wetEntry = updatedEntry;
                const totalWeightGrams = wetEntry.numberOfUnits * parseFloat(wetEntry.weightPerUnit) * (wetEntry.wetWeightUnit === 'oz' ? 28.3495 : 1);
                const dailyAmountGrams = parseFloat(wetEntry.dailyAmount) * (wetEntry.wetDailyAmountUnit === 'oz' ? 28.3495 : 1);
                const expectedDays = Math.ceil(totalWeightGrams / dailyAmountGrams);
                const statusLabel = updatedEntry.feedingStatus === 'overfeeding' ? 'Overfeeding' : updatedEntry.feedingStatus === 'slightly-over' ? 'Slightly Over' : updatedEntry.feedingStatus === 'underfeeding' ? 'Underfeeding' : updatedEntry.feedingStatus === 'slightly-under' ? 'Slightly Under' : 'Normal feeding';
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success(`✅ Finished! Consumed in ${updatedEntry.actualDaysElapsed} days (expected ${expectedDays} days). Status: ${statusLabel}`);
            } else {
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].success('Finish date updated successfully');
            }
            return updatedEntry;
        } catch (err) {
            const foodError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$api$2f$domains$2f$food$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["foodErrorHandler"])(err);
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["toastService"].error(foodError.message);
            console.error('Failed to update finish date:', err);
            return null;
        }
    }, [
        petId
    ]);
    // Calculate low stock from active entries
    const lowStockWetFoodEntries = activeWetFoodEntries.filter((entry)=>entry.remainingDays !== undefined && entry.remainingDays <= 7 && entry.remainingDays > 0);
    return {
        activeWetFoodEntries,
        finishedWetFoodEntries,
        lowStockWetFoodEntries,
        isLoading,
        error,
        createWetFoodEntry,
        updateWetFoodEntry,
        deleteWetFoodEntry,
        markWetFoodAsFinished,
        updateFinishDate,
        refetchWetFoodEntries: async ()=>{
            await Promise.all([
                fetchActiveWetFoodEntries(),
                fetchFinishedWetFoodEntries()
            ]);
        }
    };
}
}}),
"[project]/apps/web/src/types/food.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "DRY_FOOD_BAG_UNITS": (()=>DRY_FOOD_BAG_UNITS),
    "DRY_FOOD_DAILY_UNITS": (()=>DRY_FOOD_DAILY_UNITS),
    "WET_FOOD_UNITS": (()=>WET_FOOD_UNITS)
});
const DRY_FOOD_BAG_UNITS = [
    'kg',
    'pounds'
];
const DRY_FOOD_DAILY_UNITS = [
    'grams'
];
const WET_FOOD_UNITS = [
    'grams',
    'oz'
];
}}),
"[project]/apps/web/src/app/pets/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>PetsPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$contexts$2f$SessionContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/contexts/SessionContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$pets$2f$PetList$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/components/pets/PetList.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$ui$2f$skeletons$2f$PetSkeleton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/components/ui/skeletons/PetSkeleton.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/components/ui/alert.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-ssr] (ecmascript) <export default as AlertCircle>");
'use client';
;
;
;
;
;
;
function PetsPage() {
    const { user, isLoading: isLoadingUser, error: sessionError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$contexts$2f$SessionContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSessionContext"])();
    // Loading state
    if (isLoadingUser) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$ui$2f$skeletons$2f$PetSkeleton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PetListSkeleton"], {}, void 0, false, {
            fileName: "[project]/apps/web/src/app/pets/page.tsx",
            lineNumber: 16,
            columnNumber: 12
        }, this);
    }
    // Error state (not needed - middleware protects the route)
    if (sessionError) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "container mx-auto py-8 px-4",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Alert"], {
                variant: "destructive",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                        className: "h-4 w-4"
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/app/pets/page.tsx",
                        lineNumber: 24,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AlertDescription"], {
                        children: "Failed to load your session. Please try refreshing the page."
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/app/pets/page.tsx",
                        lineNumber: 25,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/src/app/pets/page.tsx",
                lineNumber: 23,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/apps/web/src/app/pets/page.tsx",
            lineNumber: 22,
            columnNumber: 7
        }, this);
    }
    // Middleware ensures user exists, but safety check
    if (!user) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$pets$2f$PetList$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
        fileName: "[project]/apps/web/src/app/pets/page.tsx",
        lineNumber: 36,
        columnNumber: 10
    }, this);
}
}}),

};

//# sourceMappingURL=apps_web_src_76510263._.js.map