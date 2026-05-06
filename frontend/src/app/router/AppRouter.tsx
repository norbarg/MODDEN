// src/app/router/AppRouter.tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from '../../shared/routes/routes';
import { LandingPage } from '../../pages/landing-page/LandingPage';
import { LoginPage } from '../../pages/login-page/LoginPage';
import { RegisterPage } from '../../pages/register-page/RegisterPage';
import { VerifyEmailPage } from '../../pages/verify-email-page/VerifyEmailPage';
import { HomePage } from '../../pages/home-page/HomePage';
import { TemplatesPage } from '../../pages/templates-page/TemplatesPage';
import { ProjectsPage } from '../../pages/projects-page/ProjectsPage';
import { EditorPage } from '../../pages/editor-page/EditorPage';
import { WorkspaceLayout } from '../../layouts/workspace-layout/WorkspaceLayout';
import { PublicRouteRedirect } from './PublicRouteRedirect';

export function AppRouter() {
    return (
        <Routes>
            <Route element={<PublicRouteRedirect />}>
                <Route path={ROUTES.LANDING} element={<LandingPage />} />
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                <Route
                    path={ROUTES.VERIFY_EMAIL}
                    element={<VerifyEmailPage />}
                />
            </Route>

            <Route element={<WorkspaceLayout />}>
                <Route path={ROUTES.HOME} element={<HomePage />} />
                <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
                <Route path={ROUTES.TEMPLATES} element={<TemplatesPage />} />
                <Route path={ROUTES.ACCOUNT} element={<HomePage />} />
            </Route>

            <Route path={ROUTES.EDITOR} element={<EditorPage />} />

            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
    );
}
