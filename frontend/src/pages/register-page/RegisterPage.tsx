// src/pages/register-page/RegisterPage.tsx
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../shared/api/authApi';
import { ROUTES } from '../../shared/routes/routes';
import { authStorage } from '../../shared/auth/authStorage';
import { GoogleAuthButton } from '../../features/workspace/ui/google-auth-button/GoogleAuthButton';
import logoWhite from '../../assets/modden-logo-white.svg';
import logoOrange from '../../assets/modden-logo-orange.svg';
import authBg from '../../assets/auth-bg-register.svg';
import './RegisterPage.css';
import { AuthBackLink } from '../../features/auth/ui/auth-back-link';

type RegisterStep = 'form' | 'waiting-verification';

export function RegisterPage() {
    const [step, setStep] = useState<RegisterStep>('form');

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [googleMessage, setGoogleMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const clearMessages = () => {
        setError('');
        setGoogleMessage('');
    };

    const saveAuthResponse = (
        response: Awaited<ReturnType<typeof authApi.googleLogin>>,
    ) => {
        authStorage.setAccessToken(response.accessToken);
        authStorage.setRefreshToken(response.refreshToken);
        authStorage.setUser(response.user);
    };

    const handleGoogleSuccess = async (credential: string) => {
        try {
            setIsLoading(true);
            setError('');
            setSuccessMessage('');
            setGoogleMessage('');

            const response = await authApi.googleLogin(credential);

            saveAuthResponse(response);
            navigate(ROUTES.HOME);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Google registration failed.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    const validateForm = () => {
        if (
            !username.trim() ||
            !email.trim() ||
            !password.trim() ||
            !confirmPassword.trim()
        ) {
            setError('Please fill in all fields.');
            return false;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return false;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return false;
        }

        return true;
    };

    const handleInitialRegister = async () => {
        if (!validateForm()) return;

        try {
            setIsLoading(true);
            setError('');
            setSuccessMessage('');
            setGoogleMessage('');

            await authApi.register({
                username: username.trim(),
                email: email.trim(),
                password,
            });

            setStep('waiting-verification');

            setSuccessMessage(
                'Account was created. Please check your email and confirm your address.',
            );
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Registration failed.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (step === 'waiting-verification') {
            setError(
                'Please verify your email first. Then go to the sign in page.',
            );
            return;
        }

        await handleInitialRegister();
    };

    return (
        <main
    className="auth-page auth-page--transition"
    style={{ backgroundImage: `url(${authBg})` }}
>
    <AuthBackLink />

    <section className="auth-page__brand">
                <img
                    src={logoWhite}
                    alt="MODDEN"
                    className="auth-page__main-logo"
                />
                <p>Sign in or create an account</p>
            </section>

            <section className="auth-card auth-card--register">
                <img
                    src={logoOrange}
                    alt="MODDEN"
                    className="auth-card__corner-logo"
                />

                <h1>Create an account</h1>

                <p className="auth-card__subtitle">
                    Already have an account?{' '}
                    <Link to={ROUTES.LOGIN}>Sign in</Link>
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label className="auth-field">
                        <span>Login</span>
                        <input
                            type="text"
                            value={username}
                            onChange={(event) =>
                                setUsername(event.target.value)
                            }
                            onFocus={clearMessages}
                            disabled={step !== 'form'}
                            autoComplete="username"
                        />
                    </label>

                    <label className="auth-field">
                        <span>Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            onFocus={clearMessages}
                            disabled={step !== 'form'}
                            autoComplete="email"
                        />
                    </label>

                    <label className="auth-field">
                        <span>Password</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            onFocus={clearMessages}
                            disabled={step !== 'form'}
                            autoComplete="new-password"
                        />
                    </label>

                    <label className="auth-field">
                        <span>Confirm Password</span>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                            onFocus={clearMessages}
                            disabled={step !== 'form'}
                            autoComplete="new-password"
                        />
                    </label>

                    {successMessage && (
                        <div className="auth-alert auth-alert--success">
                            <p>{successMessage}</p>

                            {step === 'waiting-verification' && (
                                <p className="auth-alert__small">
                                    Check your email and click the verification
                                    button. After confirmation, go to the sign
                                    in page.
                                </p>
                            )}
                        </div>
                    )}

                    {error && (
                        <p className="auth-message auth-message--error">
                            {error}
                        </p>
                    )}

                    <button
                        className="auth-submit"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Create'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span />
                    <p>Or</p>
                    <span />
                </div>

                <GoogleAuthButton
                    isLoading={isLoading}
                    onSuccess={(credential) => {
                        void handleGoogleSuccess(credential);
                    }}
                    onError={() => {
                        setError('Google registration failed.');
                    }}
                />

                {googleMessage && (
                    <p className="auth-message auth-message--info">
                        {googleMessage}
                    </p>
                )}
            </section>
        </main>
    );
}
