//src/app/router/AppRouter.tsx
import { Routes, Route } from 'react-router-dom';
import VerifyEmailPage from '../../pages/varify-email-page/VerifyEmailPage';

export function AppRouter() {
    return (
        <Routes>
            <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
    );
}
