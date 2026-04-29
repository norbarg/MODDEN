import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

type VerifyStatus = 'loading' | 'success' | 'error';

const API_BASE_URL = 'http://localhost:3000/api';

export default function VerifyEmailPage() {
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
                const response = await fetch(
                    `${API_BASE_URL}/auth/verify-email`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ token }),
                    },
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data?.message || 'Email verification failed.',
                    );
                }

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

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h1 style={styles.title}>Email verification</h1>

                {status === 'loading' && (
                    <p style={styles.text}>Verifying your email...</p>
                )}

                {status === 'success' && (
                    <>
                        <p style={{ ...styles.text, color: '#1f8b4c' }}>
                            {message}
                        </p>
                        <p style={styles.subtext}>
                            You can now go back to the app and sign in.
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <p style={{ ...styles.text, color: '#c0392b' }}>
                            {message}
                        </p>
                        <p style={styles.subtext}>
                            The verification link may be invalid or expired.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f14',
        padding: '24px',
    },
    card: {
        width: '100%',
        maxWidth: '520px',
        background: '#181820',
        border: '1px solid #2a2a35',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    },
    title: {
        margin: 0,
        marginBottom: '16px',
        color: '#ffffff',
        fontSize: '28px',
        fontWeight: 700,
    },
    text: {
        margin: 0,
        fontSize: '16px',
        color: '#e6e6e6',
    },
    subtext: {
        marginTop: '12px',
        marginBottom: 0,
        fontSize: '14px',
        color: '#a7a7b3',
    },
};
