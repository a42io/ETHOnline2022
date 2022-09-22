import { Account } from '~/entities/account';
import { JwtPayload } from 'jsonwebtoken';

declare const process: {
    env: {
        NODE_ENV: string;
        PORT: number;
        JWT_SECRET: string;
        JWT_ALGORITHM: string;
        PROJECT_ID: string;
        FIREBASE_SECRET_PATH: string;
        SESSION_EXPIRE: string;
        ALCHEMY_MAINNET_API_KEY: string;
        ALCHEMY_MATIC_API_KEY: string;
        ALCHEMY_OPTIMISM_API_KEY: string;
        ALCHEMY_ARBITRUM_API_KEY: string;
    };
};

interface Context {
    account?: Account;
    jsonPayload?: JwtPayload | string;
}

declare global {
    namespace Express {
        interface Request {
            context: Context;
        }
    }
}
