export type ErrorCode = {
    code: string;
    description: string;
};

export const UNKNOWN_ERROR: ErrorCode = {
    code: '0x5000',
    description: 'Unknown Error.',
};

export const MIDDLEWARE_AUTH_ERRORS = {
    MISSING_ACCESS_TOKEN: {
        code: '0x0001',
        description: 'Missing AccessToken',
    },
    INVALID_ACCESS_TOKEN: {
        code: '0x0002',
        description: 'Invalid AccessToken',
    },
    ACCOUNT_NOT_FOUND: {
        code: '0x0003',
        description: 'Account NotFound',
    },
};

export const MIDDLEWARE_ETH_AUTH_ERRORS = {
    INVALID_BODY: {
        code: '0x011',
        description: 'Invalid Body',
    },
    INVALID_ADDRESS: {
        code: '0x0012',
        description: 'Invalid Address',
    },
    NONCE_NOT_MATCH: {
        code: '0x0013',
        description: 'Nonce Not Match',
    },
};

export const EVENT_API_ERRORS = {
    EVENT_NOT_FOUND: {
        code: '0x0021',
        description: 'Event NotFound',
    },
    INVALID_ACCESS_TOKEN: {
        code: '0x0002',
        description: 'Invalid AccessToken',
    },
    ACCOUNT_NOT_FOUND: {
        code: '0x0003',
        description: 'Account NotFound',
    },
};
