export type Account = {
    address: string;
    createdAt: number;
};

export type AuthState = {
    isAuthenticated: boolean;
    isInitialized: boolean;
};

export type JWTContextType = {
    isAuthenticated: boolean;
    isInitialized: boolean;
    method: 'jwt';
    login: (
        message: { app: string; operation: string; nonce: string },
        signature: string
    ) => Promise<void>;
    logout: () => void;
};
