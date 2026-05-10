//src/shared/ui/project-card/ProjectCard.tsx
import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

import editIcon from '../../../../assets/project-card/edit.svg';
import deleteIcon from '../../../../assets/project-card/delete.svg';
import type { WorkspaceProject } from '../../../../shared/types/workspace';
import './ProjectCard.css';

type ProjectCardProps = {
    project: WorkspaceProject;
    onClick?: (project: WorkspaceProject) => void;
    onEdit?: (project: WorkspaceProject) => void;
    onDelete?: (project: WorkspaceProject) => void;
};

function formatCategory(category: WorkspaceProject['category']) {
    return category
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function createPreviewText(project: WorkspaceProject) {
    const words = project.title.trim().split(/\s+/).slice(0, 3);

    if (words.length === 0) {
        return 'MODDEN';
    }

    return words.join(' ');
}

function ProjectPreview({ project }: { project: WorkspaceProject }) {
    if (project.thumbnailUrl) {
        return (
            <img
                src={project.thumbnailUrl}
                alt={project.title}
                className="project-card__image"
            />
        );
    }

    return (
        <div
            className={`project-card-preview project-card-preview--${project.category.toLowerCase()}`}
        >
            <span className="project-card-preview__category">
                {formatCategory(project.category)}
            </span>

            <span className="project-card-preview__title">
                {createPreviewText(project)}
            </span>

            <span className="project-card-preview__size">
                {project.canvasWidth} × {project.canvasHeight}
            </span>
        </div>
    );
}

export function ProjectCard({
    project,
    onClick,
    onEdit,
    onDelete,
}: ProjectCardProps) {
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

    const handleCardClick = () => {
        onClick?.(project);
    };

    const handleCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick?.(project);
        }
    };

    const handleEdit = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setIsMenuOpen(false);
        onEdit?.(project);
    };

    const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setIsMenuOpen(false);
        onDelete?.(project);
    };

    return (
        <article
            className="project-card"
            role="button"
            tabIndex={0}
            onClick={handleCardClick}
            onKeyDown={handleCardKeyDown}
        >
            <div className="project-card__preview">
                <ProjectPreview project={project} />
            </div>

            <div className="project-card__body">
                <div className="project-card__info">
                    <h3>{project.title}</h3>

                    <p>
                        {formatCategory(project.category)} ·{' '}
                        {formatDate(project.updatedAt)}
                    </p>
                </div>

                <div
                    className="project-card__actions"
                    ref={menuRef}
                    onClick={(event) => event.stopPropagation()}
                >
                    <button
                        className="project-card__menu"
                        type="button"
                        aria-label={`Open actions for ${project.title}`}
                        aria-expanded={isMenuOpen}
                        onClick={() => setIsMenuOpen((current) => !current)}
                    >
                        <MoreHorizontal size={22} />
                    </button>

                    {isMenuOpen && (
                        <div className="project-card-popover">
                            <span className="project-card-popover__arrow" />

                            <button
                                type="button"
                                onClick={handleEdit}
                                className="project-card-popover__edit"
                            >
                                <img
                                    className="project-card-popover__icon"
                                    src={editIcon}
                                    alt=""
                                    aria-hidden="true"
                                />
                                <span>Edit</span>
                            </button>

                            <button
                                className="project-card-popover__delete"
                                type="button"
                                onClick={handleDelete}
                            >
                                <img
                                    className="project-card-popover__icon"
                                    src={deleteIcon}
                                    alt=""
                                    aria-hidden="true"
                                />
                                <span>Delete</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
