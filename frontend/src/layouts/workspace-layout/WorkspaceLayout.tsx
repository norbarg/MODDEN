//src/layouts/workspace-layout/WorkspaceLayout.tsx
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { WorkspaceSidebar } from '../../widgets/workspace-sidebar/WorkspaceSidebar';
import { usersApi } from '../../shared/api/usersApi';
import { ApiError } from '../../shared/api/apiClient';
import { authStorage } from '../../shared/auth/authStorage';
import { ROUTES } from '../../shared/routes/routes';
import type { AuthUser } from '../../shared/types/auth';
import './WorkspaceLayout.css';

export function WorkspaceLayout() {
    const navigate = useNavigate();

    const [user, setUser] = useState<AuthUser | null>(() =>
        authStorage.getUser(),
    );
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const accessToken = authStorage.getAccessToken();
    const refreshToken = authStorage.getRefreshToken();

    useEffect(() => {
        if (!accessToken && !refreshToken) {
            setIsCheckingAuth(false);
            return;
        }

        let isMounted = true;

        async function loadProfile() {
            try {
                const profile = await usersApi.getMe();

                if (!isMounted) {
                    return;
                }

                setUser(profile);
                authStorage.setUser(profile);
            } catch (err) {
                console.error(err);

                if (err instanceof ApiError && err.status === 401) {
                    authStorage.clear();

                    if (isMounted) {
                        navigate(ROUTES.LOGIN, { replace: true });
                    }
                }
            } finally {
                if (isMounted) {
                    setIsCheckingAuth(false);
                }
            }
        }

        void loadProfile();

        return () => {
            isMounted = false;
        };
    }, [accessToken, refreshToken, navigate]);

    if (!accessToken && !refreshToken) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (isCheckingAuth) {
        return (
            <main className="workspace-layout">
                <WorkspaceSidebar />

                <section className="workspace-layout__content">
                    <div className="workspace-layout__loader">
                        Loading workspace...
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="workspace-layout">
            <WorkspaceSidebar />

            <section className="workspace-layout__content">
                <Outlet context={{ user }} />
            </section>
        </main>
    );
}
