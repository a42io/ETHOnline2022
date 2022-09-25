import { useState, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// hooks
import useAuth from '../hooks/useAuth';
// pages
import Login from '../pages/Login';
// components
import LoadingScreen from '../components/LoadingScreen';

// ----------------------------------------------------------------------

type AuthGuardProps = {
    withRedirect?: boolean;
    children: ReactNode;
};

export default function AuthGuard({ children, withRedirect }: AuthGuardProps) {
    const { isAuthenticated, isInitialized } = useAuth();

    const { pathname } = useLocation();

    const [requestedLocation, setRequestedLocation] = useState<string | null>(
        null
    );

    if (!isInitialized) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        if (pathname !== requestedLocation) {
            setRequestedLocation(pathname);
        }
        if (withRedirect) {
            return <Navigate to={'/signin'} />;
        }
        return <Login />;
    }

    if (requestedLocation && pathname !== requestedLocation) {
        setRequestedLocation(null);
        return <Navigate to={requestedLocation} />;
    }

    return <>{children}</>;
}
