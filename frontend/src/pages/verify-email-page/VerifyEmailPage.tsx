// src/pages/verify-email-page/VerifyEmailPage.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../shared/api/authApi';
import { ROUTES } from '../../shared/routes/routes';
import logoOrange from '../../assets/modden-logo-orange.svg';
import successIcon from '../../assets/verify-success.svg';
import './VerifyEmailPage.css';

type VerifyStatus = 'loading' | 'success' | 'error';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();

  const token = useMemo(() => searchParams.get('token'), [searchParams]);

  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    if (hasVerifiedRef.current) return;

    hasVerifiedRef.current = true;

    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing.');
        return;
      }

      try {
        await authApi.verifyEmail(token);

        setStatus('success');
        setMessage('Your email has been verified successfully.');
      } catch (error) {
        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Email verification failed.',
        );
      }
    };

    void verifyEmail();
  }, [token]);

  const title =
    status === 'loading'
      ? 'Email verification'
      : status === 'success'
        ? 'Email confirmed'
        : 'Verification failed';

  const hint =
  status === 'loading'
    ? 'Please wait while we confirm your email address. This usually takes only a few seconds.'
    : status === 'success'
      ? 'Your MODDEN account is now ready. You can return to the login page, sign in with your email and password, and continue setting up your workspace.'
      : 'The verification link may be invalid or expired. Please request a new confirmation email or try signing in again later.';

  return (
    <main className="verify-page">
      <section className="verify-card">
        <div className="verify-card__top">
          <img src={logoOrange} alt="MODDEN" className="verify-card__logo" />

          <div className="verify-card__status">
            {status === 'loading' && <div className="verify-card__loader" />}

            {status === 'success' && (
  <img
    src={successIcon}
    alt="Email verified"
    className="verify-card__status-image"
  />
)}

            {status === 'error' && (
              <div className="verify-card__icon verify-card__icon--error">!</div>
            )}
          </div>
        </div>

        <div className="verify-card__body">
          <div className="verify-card__text">
            <h1>{title}</h1>
            <p>{message}</p>
            <p className="verify-card__hint">{hint}</p>
          </div>

          {status !== 'loading' && (
            <Link to={ROUTES.LOGIN} className="verify-card__button">
              Go to sign in
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
