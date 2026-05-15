// src/pages/projects-page/ProjectsPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { projectsApi } from '../../shared/api/projectsApi';
import type { WorkspaceProject } from '../../shared/types/workspace';
import { ProjectCard } from '../../features/workspace/ui/project-card';
import {
    CreateProjectModal,
    type CreateProjectFormValues,
} from '../../features/workspace/ui/create-project-modal';
import { useNavigate } from 'react-router-dom';
import { getEditorRoute } from '../../shared/routes/routes';

import searchIcon from '../../assets/home-page/search.svg';
import arrowDownIcon from '../../assets/home-page/arrow-down.svg';
import './ProjectsPage.css';

type SortMode = 'lastModified' | 'oldest' | 'titleAsc' | 'titleDesc';

const SORT_LABELS: Record<SortMode, string> = {
    lastModified: 'Last Modified',
    oldest: 'Oldest First',
    titleAsc: 'Title A-Z',
    titleDesc: 'Title Z-A',
};

const SORT_OPTIONS: SortMode[] = [
    'lastModified',
    'oldest',
    'titleAsc',
    'titleDesc',
];

function formatCategory(category: WorkspaceProject['category']) {
    return category
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function compareByTitle(first: WorkspaceProject, second: WorkspaceProject) {
    return first.title.localeCompare(second.title, 'en', {
        sensitivity: 'base',
    });
}

export function ProjectsPage() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<WorkspaceProject[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortMode, setSortMode] = useState<SortMode>('lastModified');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [editingProject, setEditingProject] =
        useState<WorkspaceProject | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSavingProject, setIsSavingProject] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function loadProjects() {
            try {
                setIsLoading(true);

                const userProjects = await projectsApi.getMyProjects();

                if (!isMounted) {
                    return;
                }

                setProjects(userProjects);
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadProjects();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredProjects = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return projects
            .filter((project) => {
                const matchesSearch =
                    !normalizedSearch ||
                    project.title.toLowerCase().includes(normalizedSearch) ||
                    formatCategory(project.category)
                        .toLowerCase()
                        .includes(normalizedSearch) ||
                    `${project.canvasWidth}x${project.canvasHeight}`.includes(
                        normalizedSearch.replace(/\s+/g, ''),
                    );

                return matchesSearch;
            })
            .sort((first, second) => {
                if (sortMode === 'oldest') {
                    return (
                        new Date(first.updatedAt).getTime() -
                        new Date(second.updatedAt).getTime()
                    );
                }

                if (sortMode === 'titleAsc') {
                    return compareByTitle(first, second);
                }

                if (sortMode === 'titleDesc') {
                    return compareByTitle(second, first);
                }

                return (
                    new Date(second.updatedAt).getTime() -
                    new Date(first.updatedAt).getTime()
                );
            });
    }, [projects, searchQuery, sortMode]);

    const handleOpenEditProjectModal = (project: WorkspaceProject) => {
        setEditingProject(project);
        setIsEditModalOpen(true);
    };

    const handleUpdateProject = async (values: CreateProjectFormValues) => {
        if (!editingProject) {
            return;
        }

        setIsSavingProject(true);

        try {
            const updatedProject = await projectsApi.updateProject(
                editingProject.id,
                {
                    title: values.title,
                    canvasWidth: values.canvasWidth,
                    canvasHeight: values.canvasHeight,
                },
            );

            setProjects((currentProjects) =>
                currentProjects.map((project) =>
                    project.id === updatedProject.id ? updatedProject : project,
                ),
            );

            setEditingProject(null);
            setIsEditModalOpen(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSavingProject(false);
        }
    };

    const handleDeleteProject = async (project: WorkspaceProject) => {
        try {
            await projectsApi.deleteProject(project.id);

            setProjects((currentProjects) =>
                currentProjects.filter(
                    (currentProject) => currentProject.id !== project.id,
                ),
            );
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <main className="projects-page">
            <section className="projects-page__header">
                <div>
                    <h1>My Projects</h1>
                    <p>
                        View, edit, and manage all your saved designs in one
                        place.
                    </p>
                </div>

                <div className="projects-page__toolbar">
                    <label className="projects-page__search">
                        <img
                            src={searchIcon}
                            alt=""
                            aria-hidden="true"
                            className="projects-page__search-icon"
                        />

                        <input
                            type="search"
                            placeholder="Search Projects"
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                        />
                    </label>
                    <div
    className={`projects-page__sort ${
        isSortOpen ? 'projects-page__sort--open' : ''
    }`}
    onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsSortOpen(false);
        }
    }}
>
    <button
        className="projects-page__sort-button"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isSortOpen}
        onClick={() => setIsSortOpen((isOpen) => !isOpen)}
    >
        <span className="projects-page__sort-label">
            {SORT_LABELS[sortMode]}
        </span>

        <img
            src={arrowDownIcon}
            alt=""
            aria-hidden="true"
            className="projects-page__sort-icon"
        />
    </button>

    {isSortOpen && (
        <div className="projects-page__sort-menu" role="listbox">
            {SORT_OPTIONS.map((option) => {
                const isSelected = option === sortMode;

                return (
                    <button
                        key={option}
                        className={`projects-page__sort-option ${
                            isSelected
                                ? 'projects-page__sort-option--active'
                                : ''
                        }`}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                            setSortMode(option);
                            setIsSortOpen(false);
                        }}
                    >
                        <span>{SORT_LABELS[option]}</span>

                        {isSelected && (
                            <span
                                className="projects-page__sort-check"
                                aria-hidden="true"
                            >
                                ●
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    )}
</div>
                </div>
            </section>

            <section className="projects-page__grid">
                {isLoading && (
                    <>
                        <div className="projects-page__skeleton" />
                        <div className="projects-page__skeleton" />
                        <div className="projects-page__skeleton" />
                    </>
                )}

                {!isLoading &&
                    filteredProjects.map((project) => (
                        <ProjectCard
                            project={project}
                            key={project.id}
                            onClick={(selectedProject) =>
                                navigate(getEditorRoute(selectedProject))
                            }
                            onEdit={handleOpenEditProjectModal}
                            onDelete={handleDeleteProject}
                        />
                    ))}
            </section>

            <CreateProjectModal
                isOpen={isEditModalOpen}
                isCreating={isSavingProject}
                mode="edit"
                initialValues={
                    editingProject
                        ? {
                              title: editingProject.title,
                              canvasWidth: editingProject.canvasWidth,
                              canvasHeight: editingProject.canvasHeight,
                          }
                        : undefined
                }
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingProject(null);
                }}
                onCreate={handleUpdateProject}
            />
        </main>
    );
}
