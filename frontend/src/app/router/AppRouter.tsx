import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from '../../shared/routes/routes';
import { LandingPage } from '../../pages/landing-page/LandingPage';
import { LoginPage } from '../../pages/login-page/LoginPage';
import { RegisterPage } from '../../pages/register-page/RegisterPage';
import { VerifyEmailPage } from '../../pages/verify-email-page/VerifyEmailPage';
import { HomePage } from '../../pages/home-page/HomePage';

export function AppRouter() {
    return (
        <Routes>
            <Route path={ROUTES.LANDING} element={<LandingPage />} />
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
            <Route path={ROUTES.HOME} element={<HomePage />} />

            <Route
                path="*"
                element={<Navigate to={ROUTES.LANDING} replace />}
            />
        </Routes>
    );
}
