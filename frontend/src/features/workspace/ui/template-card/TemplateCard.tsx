// src/shared/ui/template-card/TemplateCard.tsx
import { useEffect, useRef, useState } from 'react';
import type { WorkspaceTemplate } from '../../../../shared/types/workspace';
import moreIcon from '../../../../assets/project-card/more.svg';
import editIcon from '../../../../assets/project-card/edit.svg';
import deleteIcon from '../../../../assets/project-card/delete.svg';
import './TemplateCard.css';

type TemplateCardProps = {
    template: WorkspaceTemplate;
    canManage?: boolean;
    onClick?: (template: WorkspaceTemplate) => void;
    onEdit?: (template: WorkspaceTemplate) => void;
    onDelete?: (template: WorkspaceTemplate) => void;
};

function formatCategory(category: WorkspaceTemplate['category']) {
    return category
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function createPreviewText(template: WorkspaceTemplate) {
    const words = template.title.trim().split(/\s+/).slice(0, 3);

    if (words.length === 0) {
        return 'MODDEN';
    }

    return words.join(' ');
}

function TemplatePreview({ template }: { template: WorkspaceTemplate }) {
    if (template.thumbnailUrl) {
        return (
            <img
                src={template.thumbnailUrl}
                alt={template.title}
                className="template-card__image"
            />
        );
    }

    return (
        <div
            className={`template-card-preview template-card-preview--${template.category.toLowerCase()}`}
        >
            <span className="template-card-preview__category">
                {formatCategory(template.category)}
            </span>

            <span className="template-card-preview__title">
                {createPreviewText(template)}
            </span>

            <span className="template-card-preview__size">
                {template.canvasWidth} × {template.canvasHeight}
            </span>
        </div>
    );
}

export function TemplateCard({
    template,
    canManage = false,
    onClick,
    onEdit,
    onDelete,
}: TemplateCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isMenuOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isMenuOpen]);

    const handleEdit = () => {
        setIsMenuOpen(false);
        onEdit?.(template);
    };

    const handleDelete = () => {
        setIsMenuOpen(false);
        onDelete?.(template);
    };

    return (
        <article className="template-card">
            <button
                className="template-card__content"
                type="button"
                onClick={() => onClick?.(template)}
            >
                <div
                    className={`template-card__preview ${
                        template.thumbnailUrl
                            ? ''
                            : 'template-card__preview--empty'
                    }`}
                >
                    <TemplatePreview template={template} />
                </div>

                <div className="template-card__body">
                    <div className="template-card__info">
                        <h3>{template.title}</h3>
                        <p>{formatCategory(template.category)}</p>
                    </div>
                </div>
            </button>

            {canManage && (
                <div className="template-card__actions" ref={menuRef}>
                    <button
                        className="template-card__menu"
                        type="button"
                        aria-label={`Open actions for ${template.title}`}
                        aria-expanded={isMenuOpen}
                        onClick={() => setIsMenuOpen((current) => !current)}
                    >
                        <img
                            className="project-card__menu-icon"
                            src={moreIcon}
                            alt=""
                            aria-hidden="true"
                        />
                    </button>

                    {isMenuOpen && (
                        <div className="template-card-popover">
                            <span className="template-card-popover__arrow" />

                            <button
                                className="template-card-popover__edit"
                                type="button"
                                onClick={handleEdit}
                            >
                                <img
                                    className="template-card-popover__icon"
                                    src={editIcon}
                                    alt=""
                                    aria-hidden="true"
                                />
                                <span>Edit</span>
                            </button>

                            <button
                                className="template-card-popover__delete"
                                type="button"
                                onClick={handleDelete}
                            >
                                <img
                                    className="template-card-popover__icon"
                                    src={deleteIcon}
                                    alt=""
                                    aria-hidden="true"
                                />
                                <span>Delete</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}
