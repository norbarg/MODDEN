import customPlusIcon from '../../../assets/home-page/custom-plus.svg';
import './CustomTemplateCard.css';

type CustomTemplateCardProps = {
    disabled?: boolean;
    onClick: () => void;
};

export function CustomTemplateCard({
    disabled = false,
    onClick,
}: CustomTemplateCardProps) {
    return (
        <button
            className="custom-template-card"
            type="button"
            onClick={onClick}
            disabled={disabled}
        >
            <span className="custom-template-card__frame">
                <svg
                    className="custom-template-card__border"
                    viewBox="0 0 300 300"
                    aria-hidden="true"
                >
                    <rect
                        x="1.5"
                        y="1.5"
                        width="297"
                        height="297"
                        rx="21"
                        ry="21"
                    />
                </svg>

                <img
                    className="custom-template-card__icon"
                    src={customPlusIcon}
                    alt=""
                    aria-hidden="true"
                />

                <strong>Custom Template</strong>
                <small>Set your own canvas dimensions</small>
            </span>
        </button>
    );
}
