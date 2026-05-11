// src/shared/ui/google-auth-button/GoogleAuthButton.tsx
import { GoogleLogin } from '@react-oauth/google';
import googleLogo from '../../../assets/google-logo.svg';
import './GoogleAuthButton.css';

type GoogleAuthButtonProps = {
    isLoading?: boolean;
    onSuccess: (credential: string) => void;
    onError: () => void;
};

export function GoogleAuthButton({
    isLoading = false,
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
