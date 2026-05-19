// src/features/workspace/ui/google-auth-button/GoogleAuthButton.tsx
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import googleLogo from '../../../../assets/google-logo.svg';
import './GoogleAuthButton.css';

type GoogleAuthButtonProps = {
    isLoading?: boolean;
    onSuccess: (credential: string) => void;
    onError: () => void;
};

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function GoogleSdkButton({
    isLoading,
    onSuccess,
    onError,
}: GoogleAuthButtonProps) {
    return (
        <div className="google-auth-button">
            <button
                className="google-auth-button__visual"
                type="button"
                disabled={isLoading}
            >
                <img src={googleLogo} alt="" />
                <span>{isLoading ? 'Loading...' : 'Continue with Google'}</span>
            </button>

            <div className="google-auth-button__sdk">
                <GoogleLogin
                    onSuccess={(credentialResponse) => {
                        if (!credentialResponse.credential) {
                            onError();
                            return;
                        }

                        onSuccess(credentialResponse.credential);
                    }}
                    onError={onError}
                    text="continue_with"
                    shape="pill"
                    width="320"
                />
            </div>
        </div>
    );
}

export function GoogleAuthButton(props: GoogleAuthButtonProps) {
    if (!googleClientId) {
        return (
            <div className="google-auth-button">
                <button
                    className="google-auth-button__visual"
                    type="button"
                    disabled
                >
                    <img src={googleLogo} alt="" />
                    <span>Google login unavailable</span>
                </button>
            </div>
        );
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <GoogleSdkButton {...props} />
        </GoogleOAuthProvider>
    );
}
