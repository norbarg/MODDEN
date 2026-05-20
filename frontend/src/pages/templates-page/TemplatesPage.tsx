// src/pages/templates-page/TemplatesPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import type { AuthUser } from '../../shared/types/auth';
import {
    CreateProjectModal,
    type CreateProjectFormValues,
} from '../../features/workspace/ui/create-project-modal';

import type {
    TemplateCategory,
    WorkspaceTemplate,
} from '../../shared/types/workspace';
import { templatesApi } from '../../shared/api/templatesApi';
import { TemplateCard } from '../../features/workspace/ui/template-card';
import { useCreateProjectFromTemplate } from '../../features/workspace/model/useCreateProjectFromTemplate';

import searchIcon from '../../assets/home-page/search.svg';
import arrowDownIcon from '../../assets/home-page/arrow-down.svg';
import './TemplatesPage.css';

type TemplateFilter = TemplateCategory | 'ALL' | 'MY_TEMPLATES';

type WorkspaceOutletContext = {
    user: AuthUser | null;
};

const TEMPLATE_FILTERS: Array<{
    label: string;
    value: TemplateFilter;
}> = [
    { label: 'All Templates', value: 'ALL' },
    { label: 'My Templates', value: 'MY_TEMPLATES' },
    { label: 'Infographics', value: 'INFOGRAPHICS' },
    { label: 'Posters', value: 'POSTERS' },
    { label: 'Banners', value: 'BANNERS' },
    { label: 'Book Covers', value: 'BOOK_COVERS' },
    { label: 'Logos', value: 'LOGOS' },
    { label: 'Menus', value: 'MENUS' },
    { label: 'Social Media', value: 'SOCIAL_MEDIA' },
    { label: 'Wallpapers', value: 'WALLPAPERS' },
];

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
    'INFOGRAPHICS',
    'POSTERS',
    'BANNERS',
    'BOOK_COVERS',
    'LOGOS',
    'MENUS',
    'SOCIAL_MEDIA',
    'WALLPAPERS',
    'CUSTOM_SIZE',
];

function isTemplateFilter(value: string | null): value is TemplateFilter {
    if (!value) {
        return false;
    }

    return (
        value === 'ALL' ||
        value === 'MY_TEMPLATES' ||
        TEMPLATE_CATEGORIES.includes(value as TemplateCategory)
    );
}

function getFilterLabel(filter: TemplateFilter) {
    return (
        TEMPLATE_FILTERS.find((item) => item.value === filter)?.label ??
        'All Templates'
    );
}
function isEmptyTemplate(template: WorkspaceTemplate) {
    const normalizedTitle = template.title.toLowerCase();

    return (
        template.category === 'CUSTOM_SIZE' ||
        normalizedTitle.includes('empty') ||
        normalizedTitle.includes('custom size') ||
        normalizedTitle.includes('blank')
    );
}
export function TemplatesPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    const initialCategory = searchParams.get('category');
    const initialFilter = isTemplateFilter(initialCategory)
        ? initialCategory
        : 'ALL';

    const [templates, setTemplates] = useState<WorkspaceTemplate[]>([]);
    const [activeFilter, setActiveFilter] =
        useState<TemplateFilter>(initialFilter);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const outletContext = useOutletContext<WorkspaceOutletContext | null>();
    const user = outletContext?.user ?? null;

    const [selectedTemplate, setSelectedTemplate] =
        useState<WorkspaceTemplate | null>(null);

    const { creatingTemplateId, createProjectFromTemplate } =
        useCreateProjectFromTemplate();

    const [editingTemplate, setEditingTemplate] =
        useState<WorkspaceTemplate | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function loadTemplates() {
            try {
                setIsLoading(true);

                const availableTemplates =
                    await templatesApi.getAvailableTemplates();

                if (!isMounted) {
                    return;
                }

                setTemplates(availableTemplates);
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadTemplates();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const category = searchParams.get('category');

        if (isTemplateFilter(category)) {
            setActiveFilter(category);
            return;
        }

        setActiveFilter('ALL');
    }, [searchParams]);

    const filteredTemplates = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return templates
            .filter((template) => {
                const matchesFilter =
                    activeFilter === 'ALL'
                        ? true
                        : activeFilter === 'MY_TEMPLATES'
                          ? template.ownerUserId === user?.id &&
                            !template.isSystem
                          : template.category === activeFilter;

                const matchesSearch =
                    !normalizedSearch ||
                    template.title.toLowerCase().includes(normalizedSearch) ||
                    template.category.toLowerCase().includes(normalizedSearch);

                return matchesFilter && matchesSearch;
            })
            .sort((first, second) => {
                const firstIsEmpty = isEmptyTemplate(first);
                const secondIsEmpty = isEmptyTemplate(second);

                if (firstIsEmpty && !secondIsEmpty) {
                    return -1;
                }

                if (!firstIsEmpty && secondIsEmpty) {
                    return 1;
                }

                if (first.isSystem && !second.isSystem) {
                    return -1;
                }

                if (!first.isSystem && second.isSystem) {
                    return 1;
                }

                return first.title.localeCompare(second.title, 'en', {
                    sensitivity: 'base',
                });
            });
    }, [activeFilter, searchQuery, templates]);

    const handleOpenEditTemplateModal = (template: WorkspaceTemplate) => {
        setEditingTemplate(template);
        setIsEditModalOpen(true);
    };

    const handleUpdateTemplate = async (values: CreateProjectFormValues) => {
        if (!editingTemplate) {
            return;
        }

        setIsSavingTemplate(true);

        try {
            const updatedTemplate = await templatesApi.updateTemplate(
                editingTemplate.id,
                {
                    title: values.title,
                    canvasWidth: values.canvasWidth,
                    canvasHeight: values.canvasHeight,
                },
            );

            setTemplates((currentTemplates) =>
                currentTemplates.map((template) =>
                    template.id === updatedTemplate.id
                        ? updatedTemplate
                        : template,
                ),
            );

            setEditingTemplate(null);
            setIsEditModalOpen(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const handleDeleteTemplate = async (template: WorkspaceTemplate) => {
        try {
            await templatesApi.deleteTemplate(template.id);

            setTemplates((currentTemplates) =>
                currentTemplates.filter(
                    (currentTemplate) => currentTemplate.id !== template.id,
                ),
            );
        } catch (err) {
            console.error(err);
        }
    };

    const handleFilterChange = (value: TemplateFilter) => {
        setActiveFilter(value);

        if (value === 'ALL') {
            setSearchParams({});
            return;
        }

        setSearchParams({ category: value });
    };

    const handleTemplateClick = (template: WorkspaceTemplate) => {
        setSelectedTemplate(template);
    };

    const handleCreateProjectFromSelectedTemplate = async (
        values: CreateProjectFormValues,
    ) => {
        if (!selectedTemplate) {
            return;
        }

        await createProjectFromTemplate(selectedTemplate, values);
        setSelectedTemplate(null);
    };

    return (
        <main className="templates-page">
            <section className="templates-page__header">
                <div>
                    <h1>Templates</h1>
                    <p>
                        Explore built-in templates or use your own saved layouts
                        to start faster.
                    </p>
                </div>

                <div className="templates-page__toolbar">
                    <label className="templates-page__search">
                        <img
                            src={searchIcon}
                            alt=""
                            aria-hidden="true"
                            className="templates-page__search-icon"
                        />

                        <input
                            type="search"
                            placeholder="Search Templates"
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                        />
                    </label>
                    <div
                        className={`templates-page__filter ${
                            isFilterOpen ? 'templates-page__filter--open' : ''
                        }`}
                        onBlur={(event) => {
                            if (
                                !event.currentTarget.contains(
                                    event.relatedTarget,
                                )
                            ) {
                                setIsFilterOpen(false);
                            }
                        }}
                    >
                        <button
                            className="templates-page__filter-button"
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={isFilterOpen}
                            onClick={() => setIsFilterOpen((isOpen) => !isOpen)}
                        >
                            <span className="templates-page__filter-label">
                                {getFilterLabel(activeFilter)}
                            </span>

                            <img
                                src={arrowDownIcon}
                                alt=""
                                aria-hidden="true"
                                className="templates-page__filter-icon"
                            />
                        </button>

                        {isFilterOpen && (
                            <div
                                className="templates-page__filter-menu"
                                role="listbox"
                            >
                                {TEMPLATE_FILTERS.map((filter) => {
                                    const isSelected =
                                        filter.value === activeFilter;

                                    return (
                                        <button
                                            key={filter.value}
                                            className={`templates-page__filter-option ${
                                                isSelected
                                                    ? 'templates-page__filter-option--active'
                                                    : ''
                                            }`}
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() => {
                                                handleFilterChange(
                                                    filter.value,
                                                );
                                                setIsFilterOpen(false);
                                            }}
                                        >
                                            <span>{filter.label}</span>

                                            {isSelected && (
                                                <span
                                                    className="templates-page__filter-check"
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

            <section className="templates-page__grid">
                {isLoading && (
                    <>
                        <div className="templates-page__skeleton" />
                        <div className="templates-page__skeleton" />
                        <div className="templates-page__skeleton" />
                        <div className="templates-page__skeleton" />
                        <div className="templates-page__skeleton" />
                        <div className="templates-page__skeleton" />
                    </>
                )}

                {!isLoading &&
                    filteredTemplates.map((template) => (
                        <TemplateCard
                            template={template}
                            key={template.id}
                            canManage={
                                Boolean(user?.id) &&
                                template.ownerUserId === user?.id &&
                                !template.isSystem
                            }
                            onClick={handleTemplateClick}
                            onEdit={handleOpenEditTemplateModal}
                            onDelete={handleDeleteTemplate}
                        />
                    ))}
            </section>
            <CreateProjectModal
                isOpen={Boolean(selectedTemplate)}
                isCreating={
                    selectedTemplate
                        ? creatingTemplateId === selectedTemplate.id
                        : false
                }
                initialValues={
                    selectedTemplate
                        ? {
                              title: selectedTemplate.title,
                              canvasWidth: selectedTemplate.canvasWidth,
                              canvasHeight: selectedTemplate.canvasHeight,
                          }
                        : undefined
                }
                onClose={() => setSelectedTemplate(null)}
                onCreate={handleCreateProjectFromSelectedTemplate}
            />

            <CreateProjectModal
                isOpen={isEditModalOpen}
                isCreating={isSavingTemplate}
                mode="edit"
                initialValues={
                    editingTemplate
                        ? {
                              title: editingTemplate.title,
                              canvasWidth: editingTemplate.canvasWidth,
                              canvasHeight: editingTemplate.canvasHeight,
                          }
                        : undefined
                }
                onClose={() => {
                    setEditingTemplate(null);
                    setIsEditModalOpen(false);
                }}
                onCreate={handleUpdateTemplate}
            />
        </main>
    );
}
