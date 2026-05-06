//src/app/router/PublicRouteRedirect.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { authStorage } from '../../shared/auth/authStorage';
import { ROUTES } from '../../shared/routes/routes';

export function PublicRouteRedirect() {
    const accessToken = authStorage.getAccessToken();
    const refreshToken = authStorage.getRefreshToken();

    if (accessToken || refreshToken) {
        return <Navigate to={ROUTES.HOME} replace />;
    }

    return <Outlet />;
}
