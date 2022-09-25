import { Suspense, lazy, ElementType } from 'react';
import { Navigate, useRoutes, useLocation } from 'react-router-dom';
// layouts
import DashboardLayout from '../layouts/dashboard';
import LogoOnlyLayout from '../layouts/LogoOnlyLayout';
// components
import LoadingScreen from '../components/LoadingScreen';
// guards
import GuestGuard from '../guards/GuestGuard';
import AuthGuard from '../guards/AuthGuard';

// Suspense for lazy loading
// eslint-disable-next-line react/display-name
const Loadable = (Component: ElementType) => (props: any) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { pathname } = useLocation();

    return (
        <Suspense
            fallback={
                <LoadingScreen isDashboard={pathname.includes('/home')} />
            }
        >
            <Component {...props} />
        </Suspense>
    );
};

// ----------------------------------------------------------------------
const PageHome = Loadable(lazy(() => import('../pages/Home')));
const PageEvents = Loadable(lazy(() => import('../pages/events/Events')));
const NotFound = Loadable(lazy(() => import('../pages/NotFound')));
const Signin = Loadable(lazy(() => import('../pages/Login')));
const NewEvent = Loadable(lazy(() => import('../pages/events/NewEvent')));
const EventDetail = Loadable(lazy(() => import('../pages/events/EventDetail')));
const Proof = Loadable(lazy(() => import('../pages/proofs/Proof')));
const Proofs = Loadable(lazy(() => import('../pages/proofs/Proofs')));
const VerifyProof = Loadable(lazy(() => import('../pages/proofs/Verify')));

const ComingSoon = Loadable(lazy(() => import('../pages/ComingSoon')));

export default function Router() {
    return useRoutes([
        {
            path: '',
            element: <DashboardLayout />,
            children: [
                {
                    path: '',
                    element: <PageEvents />,
                    index: true,
                },
                {
                    path: 'new',
                    element: (
                        <AuthGuard withRedirect={true}>
                            <NewEvent />
                        </AuthGuard>
                    ),
                },
                {
                    path: ':eventId',
                    element: <EventDetail />,
                },
            ],
        },
        {
            path: 'signin',
            element: (
                <GuestGuard>
                    <Signin />
                </GuestGuard>
            ),
        },
        {
            path: 'proofs',
            element: <DashboardLayout />,
            children: [
                {
                    path: '',
                    element: (
                        <AuthGuard withRedirect={true}>
                            <Proofs />
                        </AuthGuard>
                    ),
                    index: true,
                },
                {
                    path: ':proofId',
                    element: <Proof />,
                },
            ],
        },
        {
            path: 'my',
            element: (
                <AuthGuard>
                    <DashboardLayout />
                </AuthGuard>
            ),
            children: [
                {
                    path: '',
                    element: <ComingSoon />, // 管理しているイベント一覧
                },
                {
                    path: ':eventId',
                    element: <PageHome />, //編集ページ
                },
                {
                    path: ':eventId/verify',
                    element: <VerifyProof />, // verification
                },
            ],
        },
        {
            path: '*',
            element: <LogoOnlyLayout />,
            children: [
                { path: '404', element: <NotFound /> },
                { path: '*', element: <Navigate to="/404" replace /> },
            ],
        },
        { path: '*', element: <Navigate to="/404" replace /> },
    ]);
}
