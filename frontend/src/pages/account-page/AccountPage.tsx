// src/pages/account-page/AccountPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { authApi } from '../../shared/api/authApi';
import { ApiError } from '../../shared/api/apiClient';
import { usersApi } from '../../shared/api/usersApi';
import { authStorage } from '../../shared/auth/authStorage';
import { ROUTES } from '../../shared/routes/routes';
import type { AuthUser } from '../../shared/types/auth';
import './AccountPage.css';

type WorkspaceOutletContext = {
    user: AuthUser | null;
    setUser: (user: AuthUser | null) => void;
};

type Notice = {
    type: 'success' | 'error';
    text: string;
} | null;

function formatAccountDate(value?: string) {
    if (!value) {
        return 'Not available';
    }

    return new Intl.DateTimeFormat('en', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

export function AccountPage() {
    const navigate = useNavigate();
    const { user, setUser } = useOutletContext<WorkspaceOutletContext>();

    const [username, setUsername] = useState(user?.username ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [notice, setNotice] = useState<Notice>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    useEffect(() => {
        setUsername(user?.username ?? '');
    }, [user?.username]);

    useEffect(() => {
        if (!notice) return;

        const timerId = window.setTimeout(() => {
            setNotice(null);
        }, 3000);

        return () => window.clearTimeout(timerId);
    }, [notice]);

    const trimmedUsername = username.trim();

    const hasChanges = useMemo(() => {
        return trimmedUsername.length > 0 && trimmedUsername !== user?.username;
    }, [trimmedUsername, user?.username]);

    const showNotice = (type: 'success' | 'error', text: string) => {
        setNotice({ type, text });
    };

    const handleSaveProfile = async () => {
        if (!hasChanges) return;

        setIsSaving(true);
        setNotice(null);

        try {
            const updatedUser = await usersApi.updateMe({
                username: trimmedUsername,
            });

            setUser(updatedUser);
            authStorage.setUser(updatedUser);
            showNotice('success', 'Login updated');
        } catch (err) {
            if (err instanceof ApiError) {
                showNotice('error', err.message);
            } else {
                showNotice('error', 'Unable to update login');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setNotice(null);

        try {
            await authApi.logout();
            setUser(null);
            navigate(ROUTES.LOGIN, { replace: true });
        } catch {
            showNotice('error', 'Unable to log out');
            setIsLoggingOut(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        setNotice(null);

        try {
            await usersApi.deleteMe();
            authStorage.clear();
            setUser(null);
            navigate(ROUTES.REGISTER, { replace: true });
        } catch (err) {
            if (err instanceof ApiError) {
                showNotice('error', err.message);
            } else {
                showNotice('error', 'Unable to delete account');
            }

            setIsDeleting(false);
            setIsDeleteConfirmOpen(false);
        }
    };

    return (
        <>
            <section className="workspace-hero account-hero">
                <div>
                    <h1>Account</h1>
                    <p>
Manage your personal information and account settings.
                    </p>
                </div>
            </section>

            <section className="account-page">
                {notice && (
                    <div
                        className={`account-notice account-notice--${notice.type}`}
                    >
                        <span className="account-notice__dot" />
                        <span>{notice.text}</span>

                        <button
                            type="button"
                            onClick={() => setNotice(null)}
                            aria-label="Close notification"
                        >
                            ×
                        </button>
                    </div>
                )}

                <div className="account-content">
                    <div className="account-main">
                        <label className="account-field">
                            <div className="account-field-head">
                                <span>Login</span>
                            </div>

                            <div className="account-input-row">
                                <input
                                    type="text"
                                    value={username}
                                    placeholder="Login"
                                    onChange={(event) =>
                                        setUsername(event.target.value)
                                    }
                                />

                                {hasChanges && (
                                    <button
                                        className="account-save-btn"
                                        type="button"
                                        disabled={isSaving}
                                        onClick={handleSaveProfile}
                                    >
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                )}
                            </div>

                            <small className="account-created">
                                Account created:{' '}
                                <strong>
                                    {formatAccountDate(user?.createdAt)}
                                </strong>
                            </small>
                        </label>

                        <div className="account-field">
                            <span>Email address</span>
                            <p className="account-email">
                                {user?.email ?? 'Not available'}
                            </p>
                        </div>
                    </div>

                    <div className="account-logout">
                        <h3>Are you sure you want to log out?</h3>
                        <p>You can always sign back in later.</p>

                        <button
                            className="account-logout-btn"
                            type="button"
                            disabled={isLoggingOut}
                            onClick={handleLogout}
                        >
                            {isLoggingOut ? 'Logging out...' : 'Log Out'}
                        </button>
                    </div>
                </div>

                <div className="account-divider" />

                <div className="account-delete">
                    <h3>
                        Delete {user?.username ?? 'your'} Workspace account
                    </h3>

                    <p>
                        *This can't be reversed. All visuals & videos you've
                        created will be permanently erased.
                    </p>

                    {!isDeleteConfirmOpen ? (
                        <button
                            className="account-delete-btn"
                            type="button"
                            onClick={() => setIsDeleteConfirmOpen(true)}
                        >
                            Delete
                        </button>
                    ) : (
                        <div className="account-delete-confirm">
                            <span>Confirm account deletion?</span>

                            <div>
                                <button
                                    className="account-cancel-btn"
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={() =>
                                        setIsDeleteConfirmOpen(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    className="account-delete-btn"
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={handleDeleteAccount}
                                >
                                    {isDeleting ? 'Deleting...' : 'Yes, delete'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
