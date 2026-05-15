//src/pages/home-page/HomePage.tsx
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ROUTES, getEditorRoute } from '../../shared/routes/routes';

import { projectsApi } from '../../shared/api/projectsApi';
import { templatesApi } from '../../shared/api/templatesApi';
import type { AuthUser } from '../../shared/types/auth';
import type {
    TemplateCategory,
    WorkspaceProject,
    WorkspaceTemplate,
} from '../../shared/types/workspace';

import searchIcon from '../../assets/home-page/search.svg';
import arrowDownIcon from '../../assets/home-page/arrow-down.svg';
import allTemplatesIcon from '../../assets/home-page/all-templates.svg';
import infographicsIcon from '../../assets/home-page/infographics.svg';
import postersIcon from '../../assets/home-page/posters.svg';
import bannersIcon from '../../assets/home-page/banners.svg';
import bookCoversIcon from '../../assets/home-page/book-covers.svg';
import logosIcon from '../../assets/home-page/logos.svg';
import menusIcon from '../../assets/home-page/menus.svg';
import socialMediaIcon from '../../assets/home-page/social-media.svg';
import wallpapersIcon from '../../assets/home-page/wallpapers.svg';
import './HomePage.css';

import { ProjectCard } from '../../features/workspace/ui/project-card';
import { CustomTemplateCard } from '../../features/workspace/ui/custom-template-card';
import {
    CreateProjectModal,
    type CreateProjectFormValues,
} from '../../features/workspace/ui/create-project-modal';

type WorkspaceOutletContext = {
    user: AuthUser | null;
};

type SortMode = 'lastModified' | 'oldest' | 'titleAsc' | 'titleDesc';

type TemplateCategoryItem = {
    category: TemplateCategory | 'ALL';
    label: string;
    icon: string;
    color: string;
};

const TEMPLATE_CATEGORIES: TemplateCategoryItem[] = [
    {
        category: 'ALL',
        label: 'All Templates',
        icon: allTemplatesIcon,
        color: '#F8A1C4',
    },
    {
        category: 'INFOGRAPHICS',
        label: 'Infographics',
        icon: infographicsIcon,
        color: '#A9AF95',
    },
    {
        category: 'POSTERS',
        label: 'Posters',
        icon: postersIcon,
        color: '#F8E28C',
    },
    {
        category: 'BANNERS',
        label: 'Banners',
        icon: bannersIcon,
        color: '#93A2A7',
    },
    {
        category: 'BOOK_COVERS',
        label: 'Book Covers',
        icon: bookCoversIcon,
        color: '#F77053',
    },
    {
        category: 'LOGOS',
        label: 'Logos',
        icon: logosIcon,
        color: '#DBC1E8',
    },
    {
        category: 'MENUS',
        label: 'Menus',
        icon: menusIcon,
        color: '#B89A66',
    },
    {
        category: 'SOCIAL_MEDIA',
        label: 'Social Media',
        icon: socialMediaIcon,
        color: '#EB6087',
    },
    {
        category: 'WALLPAPERS',
        label: 'Wallpapers',
        icon: wallpapersIcon,
        color: '#A3BFE4',
    },
];

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

function getDisplayName(user: AuthUser | null) {
    if (!user?.username) {
        return 'Your';
    }

    return `${user.username}'s`;
}

function formatCategory(category: TemplateCategory) {
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

export function HomePage() {
    const navigate = useNavigate();
    const { user } = useOutletContext<WorkspaceOutletContext>();

    const [templates, setTemplates] = useState<WorkspaceTemplate[]>([]);
    const [projects, setProjects] = useState<WorkspaceProject[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortMode, setSortMode] = useState<SortMode>('lastModified');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [editingProject, setEditingProject] =
        useState<WorkspaceProject | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleOpenEditProjectModal = (project: WorkspaceProject) => {
        setEditingProject(project);
        setIsEditModalOpen(true);
    };

    const handleUpdateProject = async (values: CreateProjectFormValues) => {
        if (!editingProject) {
            return;
        }

        setIsCreating(true);

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
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteProject = async (project: WorkspaceProject) => {
        const shouldDelete = window.confirm(
            `Delete project "${project.title}"?`,
        );

        if (!shouldDelete) {
            return;
        }

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

    useEffect(() => {
        let isMounted = true;

        async function loadHomePageData() {
            try {
                setIsLoading(true);

                const [systemTemplates, userProjects] = await Promise.all([
                    templatesApi.getSystemTemplates(),
                    projectsApi.getMyProjects(),
                ]);

                if (!isMounted) {
                    return;
                }

                setTemplates(systemTemplates);
                setProjects(userProjects);
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadHomePageData();

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

    const customTemplate = useMemo(
        () =>
            templates.find((template) => template.category === 'CUSTOM_SIZE') ??
            null,
        [templates],
    );

    const handleCreateCustomProject = async (
        values: CreateProjectFormValues,
    ) => {
        if (!customTemplate) {
            throw new Error('Custom Size system template was not found.');
        }

        setIsCreating(true);

        try {
            const createdProject = await projectsApi.createProject({
                templateId: customTemplate.id,
                title: values.title,
                canvasWidth: values.canvasWidth,
                canvasHeight: values.canvasHeight,
            });

            navigate(getEditorRoute(createdProject));
            setIsCreateModalOpen(false);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            <main className="home-page">
                <section className="workspace-hero">
                    <div>
                        <h1>What would you like to create?</h1>
                        <p>
                            Start with a template or build your design from
                            scratch.
                        </p>
                    </div>
                </section>

                <section
                    className="template-strip"
                    id="workspace-templates"
                    aria-label="Template categories"
                >
                    {TEMPLATE_CATEGORIES.map((item) => {
                        return (
                            <button
                                className="template-strip__item"
                                type="button"
                                key={item.category}
                                onClick={() => {
                                    const searchParams =
                                        item.category === 'ALL'
                                            ? ''
                                            : `?category=${item.category}`;

                                    navigate(
                                        `${ROUTES.TEMPLATES}${searchParams}`,
                                    );
                                }}
                            >
                                <span
                                    className="template-strip__icon"
                                    style={
                                        {
                                            '--template-icon-bg': item.color,
                                        } as CSSProperties
                                    }
                                >
                                    <img
                                        src={item.icon}
                                        alt=""
                                        aria-hidden="true"
                                        className="template-strip__icon-img"
                                    />
                                </span>

                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </section>

                <section className="workspace-content" id="workspace-projects">
                    <div className="workspace-heading-row">
                        <div>
                            <h2>{getDisplayName(user)} Visual Workspace</h2>
                            <p>
                                View and manage all your projects, including
                                visuals and image files
                            </p>
                        </div>

                        <div className="workspace-toolbar">
                            <label className="workspace-search">
                                <img
                                    className="workspace-search__icon"
                                    src={searchIcon}
                                    alt=""
                                    aria-hidden="true"
                                />

                                <input
                                    type="search"
                                    placeholder="Search your projects"
                                    value={searchQuery}
                                    onChange={(event) =>
                                        setSearchQuery(event.target.value)
                                    }
                                />
                            </label>
                            <div
    className={`workspace-sort ${isSortOpen ? 'workspace-sort--open' : ''}`}
    onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsSortOpen(false);
        }
    }}
>
    <button
        className="workspace-sort__button"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isSortOpen}
        onClick={() => setIsSortOpen((isOpen) => !isOpen)}
    >
        <span className="workspace-sort__label">
            {SORT_LABELS[sortMode]}
        </span>

        <img
            className="workspace-sort__icon"
            src={arrowDownIcon}
            alt=""
            aria-hidden="true"
        />
    </button>

    {isSortOpen && (
        <div className="workspace-sort__menu" role="listbox">
            {SORT_OPTIONS.map((option) => {
                const isSelected = option === sortMode;

                return (
                    <button
                        key={option}
                        className={`workspace-sort__option ${
                            isSelected ? 'workspace-sort__option--active' : ''
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
                                className="workspace-sort__check"
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
                    </div>

                    <div className="workspace-grid">
                        <CustomTemplateCard
                            disabled={isLoading}
                            onClick={() => setIsCreateModalOpen(true)}
                        />

                        {isLoading && (
                            <>
                                <div className="workspace-project-skeleton" />
                                <div className="workspace-project-skeleton" />
                            </>
                        )}

                        {!isLoading &&
                            filteredProjects.map((project) => (
                                <ProjectCard
                                    project={project}
                                    key={project.id}
                                    onClick={(selectedProject) =>
                                        navigate(
                                            getEditorRoute(selectedProject),
                                        )
                                    }
                                    onEdit={handleOpenEditProjectModal}
                                    onDelete={handleDeleteProject}
                                />
                            ))}
                    </div>
                </section>
                <CreateProjectModal
                    isOpen={isCreateModalOpen}
                    isCreating={isCreating}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreate={handleCreateCustomProject}
                />
                <CreateProjectModal
                    isOpen={isEditModalOpen}
                    isCreating={isCreating}
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
        </>
    );
}
