import { createContext, ReactNode, useEffect, useState } from 'react';
import { AuthState, JWTContextType } from '../@types/auth';
import { isValidToken, setSession } from '../utils/jwt';
import axios from '../utils/axios';
import { useAccount } from 'wagmi';
import { utils } from 'ethers';

const initialState: AuthState = {
    isAuthenticated: false,
    isInitialized: false,
};

export const AuthContext = createContext<JWTContextType>({
    ...initialState,
    login: async () => {},
    logout: () => {},
    method: 'jwt',
});

type AuthProviderProps = {
    children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [state, setState] = useState<AuthState>(initialState);
    const { isDisconnected, address } = useAccount({});

    useEffect(() => {
        if (address) {
            const current = localStorage.getItem('currentAddress');
            if (!current) {
                localStorage.setItem('currentAddress', address);
                return;
            }
            if (utils.getAddress(current) !== utils.getAddress(address)) {
                setSession(null);
                localStorage.removeItem('currentAddress');
                setState({
                    isAuthenticated: false,
                    isInitialized: true,
                });
                return;
            }
        }

        if (isDisconnected) {
            setSession(null);
            localStorage.removeItem('currentAddress');
            setState({
                isAuthenticated: false,
                isInitialized: true,
            });
        }
    }, [address, isDisconnected]);

    useEffect(() => {
        const initialize = async () => {
            try {
                const accessToken = localStorage.getItem('accessToken');
                if (accessToken && isValidToken(accessToken)) {
                    setSession(accessToken);
                    setState({
                        isAuthenticated: true,
                        isInitialized: true,
                    });
                } else {
                    setSession(null);
                    setState({
                        isAuthenticated: false,
                        isInitialized: true,
                    });
                }
            } catch (err) {
                console.error(err);
                setState({
                    isAuthenticated: false,
                    isInitialized: true,
                });
            }
        };
        initialize();
    }, []);

    const login = async (
        message: { app: string; operation: string; nonce: string },
        signature: string
    ) => {
        const response = await axios.post('/signin', {
            message,
            signature,
        });
        const { accessToken } = response.data;
        setState({ isAuthenticated: true, isInitialized: true });
        setSession(accessToken);
    };

    const logout = async () => {
        setSession(null);
        setState({ isAuthenticated: false, isInitialized: true });
    };

    return (
        <AuthContext.Provider
            value={{
                ...state,
                method: 'jwt',
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
