//src/features/editor/ui/auth-back-link/AuthBackLink.tsx
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../../shared/routes/routes';
import backArrowIcon from '../../../../assets/auth-back-arrow.svg';
import './AuthBackLink.css';

export function AuthBackLink() {
    return (
        <Link to={ROUTES.LANDING} className="auth-back-link">
            <img
                src={backArrowIcon}
                alt=""
                aria-hidden="true"
                className="auth-back-link__icon"
            />

            <span>Back</span>
        </Link>
    );
}
