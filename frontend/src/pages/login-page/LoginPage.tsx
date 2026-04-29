//src/pages/login-page/LoginPage.tsx
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../shared/api/authApi';
import { ROUTES } from '../../shared/routes/routes';
import logoWhite from '../../assets/modden-logo-white.svg';
import logoOrange from '../../assets/modden-logo-orange.svg';
import googleLogo from '../../assets/google-logo.svg';
import authBg from '../../assets/auth-bg-login.svg';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [googleMessage, setGoogleMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const clearMessages = () => {
  setError('');
  setGoogleMessage('');
};

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');
    setGoogleMessage('');

    if (!identifier.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setIsLoading(true);

      const response = await authApi.login({
        identifier: identifier.trim(),
        password,
      });

      localStorage.setItem('modden_access_token', response.accessToken);
      localStorage.setItem('modden_refresh_token', response.refreshToken);
      localStorage.setItem('modden_user', JSON.stringify(response.user));

      navigate(ROUTES.HOME);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleStub = () => {
    setGoogleMessage('Google authentication will be added later.');
  };

  return (
    <main className="auth-page auth-page--transition" style={{ backgroundImage: `url(${authBg})` }}>
      <section className="auth-page__brand">
        <img src={logoWhite} alt="MODDEN" className="auth-page__main-logo" />
        <p>Sign in or create an account</p>
      </section>

      <section className="auth-card">
        <img src={logoOrange} alt="MODDEN" className="auth-card__corner-logo" />

        <h1>Sign in</h1>

        <p className="auth-card__subtitle">
          New user? <Link to={ROUTES.REGISTER}>Create an account</Link>
        </p>

        <form className="auth-form" onSubmit={handleLogin}>
          <label className="auth-field">
            <span>Email/Login</span>
            <input
  type="text"
  value={identifier}
  onChange={(event) => setIdentifier(event.target.value)}
  onFocus={clearMessages}
  autoComplete="username"
/>
          </label>

          <label className="auth-field">
            <span>Password</span>
  <input
  type="password"
  value={password}
  onChange={(event) => setPassword(event.target.value)}
  onFocus={clearMessages}
  autoComplete="current-password"
/>
          </label>

          {error && <p className="auth-message auth-message--error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Log in'}
          </button>
        </form>

        <div className="auth-divider">
          <span />
          <p>Or</p>
          <span />
        </div>

        <button className="google-button" type="button" onClick={handleGoogleStub}>
          <img src={googleLogo} alt="" />
          Continue with Google
        </button>

        {googleMessage && <p className="auth-message auth-message--info">{googleMessage}</p>}
      </section>
    </main>
  );
}
