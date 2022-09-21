export type ErrorCode = {
    code: string;
    description: string;
};

export const UNKNOWN_ERROR = {
    code: '0x5000',
    description: 'Unknown Error',
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
        code: '0x101',
        description: 'Invalid Body',
    },
    INVALID_ADDRESS: {
        code: '0x0102',
        description: 'Invalid Address',
    },
    NONCE_NOT_MATCH: {
        code: '0x0103',
        description: 'Nonce Not Match',
    },
};

export const AUTH_API_ERRORS = {
    AUTH_UNKNOWN_ERROR: {
        code: '0x0200',
        description: 'Unknown Error',
    },
    INVALID_QUERY_PARAMS: {
        code: '0x0201',
        description: 'Invalid Query Params',
    },
}

export const EVENT_API_ERRORS = {
    EVENT_UNKNOWN_ERROR: {
        code: '0x0300',
        description: 'Unknown Error',
    },
    EVENT_NOT_FOUND: {
        code: '0x0301',
        description: 'Event NotFound',
    },
    INVALID_QUERY_PARAMS: {
        code: '0x0302',
        description: 'Invalid Query Params',
    },
    UNAUTHORIZED_ACCOUNT: {
        code: '0x0303',
        description: 'Unauthorized Account',
    },
    UPDATE_FORBIDDEN: {
        code: '0x0304',
        description: 'Update Event Forbidden',
    },
};

export const TICKET_API_ERRORS = {
    TICKET_UNKNOWN_ERROR: {
        code: '0x0400',
        description: 'Unknown Error',
    },
    TICKETS_NULL: {
        code: '0x0400',
        description: 'Ticket Null Error',
    },
    TICKET_NOT_FOUND: {
        code: '0x0401',
        description: 'Ticket Null Error',
    },
    INVALID_BODY: {
        code: '0x0402',
        description: 'Invalid Body',
    },
    INVALID_MESSAGE_JSON: {
        code: '0x0403',
        description: 'Invalid Message JSON',
    },
    EVENT_NOT_FOUND: {
        code: '0x0404',
        description: 'Event Not Found',
    },
    EVENT_INVALID_TERM: {
        code: '0x0405',
        description: 'Event Invalid Term',
    },
    VALID_TICKET_EXITS: {
        code: '0x0405',
        description: 'Valid Ticket Exists',
    },
    TOKEN_NOT_INCLUDED: {
        code: '0x0406',
        description: 'Token Not Included AllowList',
    },
    NOT_TOKEN_OWNER: {
        code: '0x0406',
        description: 'Not Token Owner',
    },
    ENS_NOT_INCLUDED: {
        code: '0x0407',
        description: 'ENS Not Included AllowList',
    },
    NOT_ENS_OWNER: {
        code: '0x0408',
        description: 'Not ENS Owner',
    },
    UNAUTHORIZED_ACCOUNT: {
        code: '0x0409',
        description: 'Unauthorized Account For Event',
    },
    INVALIDATED_TICKET: {
        code: '0x0410',
        description: 'Ticket Invalidated',
    },
    VERIFIED_TICKET: {
        code: '0x0411',
        description: 'Ticket Verified',
    },
    INVALID_SIGNATURE: {
        code: '0x0412',
        description: 'Invalid Signature',
    },
    INVALID_NONCE: {
        code: '0x0413',
        description: 'Invalid Nonce',
    },
    INVALID_ENS: {
        code: '0x0414',
        description: 'Invalid ENS',
    },
    INVALID_NFT: {
        code: '0x0415',
        description: 'Invalid ENS',
    },
    USED_TOKEN: {
        code: '0x0416',
        description: 'Token Already Used',
    },
    EXCEEDED_MAXIMUM_USE_COUNT: {
        code: '0x0417',
        description: 'Exceeded Maximum Use Count',
    },
}
