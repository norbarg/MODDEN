// src/pages/editor-page/EditorPage.tsx
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { projectsApi } from '../../shared/api/projectsApi';
import { templatesApi } from '../../shared/api/templatesApi';
import { ApiError } from '../../shared/api/apiClient';
import { authStorage } from '../../shared/auth/authStorage';
import { ROUTES } from '../../shared/routes/routes';
import { useEditorHistory } from '../../features/editor/model/useEditorHistory';
import type {
    WorkspaceProject,
    WorkspaceTemplate,
} from '../../shared/types/workspace';
import { EditorLayout } from '../../layouts/editor-layout/EditorLayout';
import {
    DEFAULT_EDITOR_SCENE,
    normalizeEditorScene,
} from '../../features/editor/model/editorDefaults';
import type {
    EditorOption,
    EditorPanel,
    EditorScene,
} from '../../features/editor/model/editorTypes';
import {
    CreateProjectModal,
    type CreateProjectFormValues,
} from '../../features/workspace/ui/create-project-modal';
import {
    SaveProjectModal,
    type SaveProjectOptions,
} from '../../features/editor/ui/modals/save-project-modal';
import { UnsavedChangesModal } from '../../features/editor/ui/modals/unsaved-changes-modal';
import { editorDraftStorage } from '../../features/editor/model/editorDraftStorage';
import './EditorPage.css';

export function EditorPage() {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();

    const [project, setProject] = useState<WorkspaceProject | null>(null);

    const [activePanel, setActivePanel] = useState<EditorPanel>(null);
    const [activeOption, setActiveOption] = useState<EditorOption>(null);

    const [recentCanvasColors, setRecentCanvasColors] = useState<string[]>([
        '#ffffff',
        '#5ed99a',
        '#ff4b0b',
        '#ff5b8a',
        '#9fbd5c',
        '#1767c7',
    ]);

    const [toolColors, setToolColors] = useState<Record<string, string>>({
        pencil: '#98BA61',
        marker: '#F8A1C4',
        highliter: '#48D8FE',
        eraser: '#FE5F96',
    });

    const [recentToolColors, setRecentToolColors] = useState<string[]>([
        '#98BA61',
        '#F8A1C4',
        '#48D8FE',
        '#FE5F96',
        '#1767c7',
        '#ff4b0b',
    ]);

    const [toolStrokeWidths, setToolStrokeWidths] = useState<
        Record<string, number>
    >({
        pencil: 5,
        marker: 12,
        highliter: 22,
        eraser: 28,
    });

    const [zoom, setZoom] = useState(100);
    const [isLoading, setIsLoading] = useState(true);

    const [isMetaDirty, setIsMetaDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
    const [shouldLeaveAfterSave, setShouldLeaveAfterSave] = useState(false);

    const [isSavingProject, setIsSavingProject] = useState(false);

    const accessToken = authStorage.getAccessToken();
    const refreshToken = authStorage.getRefreshToken();

    const [linkedTemplate, setLinkedTemplate] =
        useState<WorkspaceTemplate | null>(null);

    const [saveProjectOptions, setSaveProjectOptions] =
        useState<SaveProjectOptions>({
            saveAsTemplate: true,
            isPublic: false,
        });

    const isRestoringDraftRef = useRef(false);

    const {
        scene,
        pastScenes,
        futureScenes,
        isSceneDirty,
        canUndo,
        canRedo,
        resetScene,
        startSceneTransaction,
        previewScene,
        commitSceneTransaction,
        applySceneChange,
        undo,
        redo,
        markSceneAsSaved,
        restoreDraftHistory,
    } = useEditorHistory({
        initialScene: DEFAULT_EDITOR_SCENE,
        hotkeysDisabled:
            isEditModalOpen || isSaveModalOpen || isUnsavedModalOpen,
    });

    const isDirty = isSceneDirty || isMetaDirty;

    useEffect(() => {
        if (!project || isRestoringDraftRef.current) {
            return;
        }

        if (!isSceneDirty) {
            return;
        }

        editorDraftStorage.set({
            projectId: project.id,
            scene,
            pastScenes,
            futureScenes,
            recentCanvasColors,
        });
    }, [
        project,
        scene,
        pastScenes,
        futureScenes,
        recentCanvasColors,
        isSceneDirty,
    ]);

    useEffect(() => {
        if (!projectId) {
            return;
        }

        const currentProjectId = projectId;
        let isMounted = true;

        async function loadProject() {
            try {
                setIsLoading(true);

                const [loadedProject, myTemplates] = await Promise.all([
                    projectsApi.getProject(currentProjectId),
                    templatesApi.getMyTemplates(),
                ]);

                if (!isMounted) {
                    return;
                }

                const existingTemplate =
                    myTemplates.find(
                        (template) =>
                            template.sourceProjectId === loadedProject.id,
                    ) ?? null;

                const normalizedScene = normalizeEditorScene(
                    loadedProject.sceneJson,
                );
                const draft = editorDraftStorage.get(loadedProject.id);

                setProject(loadedProject);

                isRestoringDraftRef.current = true;

                resetScene(normalizedScene, true);

                if (draft) {
                    restoreDraftHistory({
                        scene: draft.scene,
                        pastScenes: draft.pastScenes,
                        futureScenes: draft.futureScenes,
                    });

                    if (draft.recentCanvasColors.length > 0) {
                        setRecentCanvasColors(draft.recentCanvasColors);
                    }
                }

                queueMicrotask(() => {
                    isRestoringDraftRef.current = false;
                });
                setLinkedTemplate(existingTemplate);

                setSaveProjectOptions({
                    saveAsTemplate: Boolean(existingTemplate),
                    isPublic: existingTemplate?.isPublic ?? false,
                });

                setIsMetaDirty(false);
            } catch (err) {
                console.error(err);

                if (err instanceof ApiError && err.status === 401) {
                    authStorage.clear();
                    navigate(ROUTES.LOGIN, { replace: true });
                    return;
                }

                if (err instanceof ApiError && err.status === 404) {
                    navigate(ROUTES.PROJECTS, { replace: true });
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadProject();

        return () => {
            isMounted = false;
        };
    }, [navigate, projectId, resetScene, restoreDraftHistory]);

    const handleToolColorPreview = (toolId: string, color: string) => {
        setToolColors((prev) => ({
            ...prev,
            [toolId]: color,
        }));
    };

    const handleToolColorCommit = (toolId: string, color: string) => {
        setToolColors((prev) => ({
            ...prev,
            [toolId]: color,
        }));

        setRecentToolColors((prev) => {
            const nextColors = [
                color,
                ...prev.filter(
                    (recentColor) =>
                        recentColor.toLowerCase() !== color.toLowerCase(),
                ),
            ];

            return nextColors.slice(0, 8);
        });
    };

    const handleToolStrokeWidthChange = (
        toolId: string,
        strokeWidth: number,
    ) => {
        setToolStrokeWidths((prev) => ({
            ...prev,
            [toolId]: strokeWidth,
        }));
    };

    const handlePanelChange = (nextPanel: EditorPanel) => {
        setActivePanel(nextPanel);
        setActiveOption(null);
    };

    const handleCanvasBackgroundChangeStart = () => {
        startSceneTransaction();
    };

    const handleCanvasBackgroundPreview = (color: string) => {
        previewScene((currentScene: EditorScene) => ({
            ...currentScene,
            background: {
                type: 'color',
                color,
            },
        }));
    };

    const handleCanvasBackgroundCommit = (color: string) => {
        commitSceneTransaction();

        setRecentCanvasColors((currentColors) => {
            const normalizedColor = color.toLowerCase();

            return [
                normalizedColor,
                ...currentColors.filter(
                    (item) => item.toLowerCase() !== normalizedColor,
                ),
            ].slice(0, 6);
        });
    };

    const handleSaveProject = async (options: SaveProjectOptions) => {
        if (!project) {
            return;
        }

        setIsSaving(true);

        try {
            const updatedProject = await projectsApi.updateProject(project.id, {
                sceneJson: scene,
            });

            setProject(updatedProject);

            if (options.saveAsTemplate) {
                const templatePayload = {
                    title: updatedProject.title,
                    category: updatedProject.category,
                    canvasWidth: updatedProject.canvasWidth,
                    canvasHeight: updatedProject.canvasHeight,
                    sceneJson: scene,
                    thumbnailUrl: updatedProject.thumbnailUrl ?? null,
                    isPublic: options.isPublic,
                };

                if (linkedTemplate) {
                    const updatedTemplate = await templatesApi.updateTemplate(
                        linkedTemplate.id,
                        templatePayload,
                    );

                    setLinkedTemplate(updatedTemplate);
                } else {
                    const createdTemplate = await templatesApi.createTemplate({
                        sourceProjectId: updatedProject.id,
                        ...templatePayload,
                    });

                    setLinkedTemplate(createdTemplate);
                }
            } else if (linkedTemplate) {
                await templatesApi.deleteTemplate(linkedTemplate.id);
                setLinkedTemplate(null);
            }

            setSaveProjectOptions(options);
            markSceneAsSaved(scene);
            setIsMetaDirty(false);
            setIsSaveModalOpen(false);
            editorDraftStorage.remove(project.id);

            if (shouldLeaveAfterSave) {
                navigate(ROUTES.PROJECTS);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
            setShouldLeaveAfterSave(false);
        }
    };

    const handleBack = () => {
        if (isDirty) {
            setIsUnsavedModalOpen(true);
            return;
        }

        navigate(ROUTES.PROJECTS);
    };

    const handleSaveAndLeave = () => {
        setIsUnsavedModalOpen(false);
        setShouldLeaveAfterSave(true);
        setIsSaveModalOpen(true);
    };

    const handleUpdateProjectMeta = async (values: CreateProjectFormValues) => {
        if (!project) {
            return;
        }

        setIsSavingProject(true);

        try {
            const updatedProject = await projectsApi.updateProject(project.id, {
                title: values.title,
                canvasWidth: values.canvasWidth,
                canvasHeight: values.canvasHeight,
            });

            setProject(updatedProject);
            setIsEditModalOpen(false);
            setIsMetaDirty(true);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSavingProject(false);
        }
    };

    if (!accessToken && !refreshToken) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (!projectId) {
        return <Navigate to={ROUTES.PROJECTS} replace />;
    }

    if (isLoading) {
        return <main className="editor-page-loader">Loading editor...</main>;
    }

    if (!project) {
        return <Navigate to={ROUTES.PROJECTS} replace />;
    }

    return (
        <>
            <EditorLayout
                project={project}
                scene={scene}
                activePanel={activePanel}
                activeOption={activeOption}
                recentCanvasColors={recentCanvasColors}
                toolColors={toolColors}
                toolStrokeWidths={toolStrokeWidths}
                recentToolColors={recentToolColors}
                zoom={zoom}
                isDirty={isDirty}
                isSaving={isSaving}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
                onPanelChange={handlePanelChange}
                onOptionChange={setActiveOption}
                onSceneCommit={(nextScene) => applySceneChange(nextScene)}
                onToolColorPreview={handleToolColorPreview}
                onToolColorCommit={handleToolColorCommit}
                onToolStrokeWidthChange={handleToolStrokeWidthChange}
                onCanvasBackgroundChangeStart={
                    handleCanvasBackgroundChangeStart
                }
                onCanvasBackgroundPreview={handleCanvasBackgroundPreview}
                onCanvasBackgroundCommit={handleCanvasBackgroundCommit}
                onZoomChange={setZoom}
                onOpenProjectSettings={() => setIsEditModalOpen(true)}
                onOpenSaveProject={() => setIsSaveModalOpen(true)}
                onBack={handleBack}
            />

            <CreateProjectModal
                isOpen={isEditModalOpen}
                isCreating={isSavingProject}
                mode="edit"
                initialValues={{
                    title: project.title,
                    canvasWidth: project.canvasWidth,
                    canvasHeight: project.canvasHeight,
                }}
                onClose={() => setIsEditModalOpen(false)}
                onCreate={handleUpdateProjectMeta}
            />

            <SaveProjectModal
                isOpen={isSaveModalOpen}
                isSaving={isSaving}
                initialOptions={saveProjectOptions}
                onClose={() => {
                    setIsSaveModalOpen(false);
                    setShouldLeaveAfterSave(false);
                }}
                onSave={handleSaveProject}
            />

            <UnsavedChangesModal
                isOpen={isUnsavedModalOpen}
                onCancel={() => setIsUnsavedModalOpen(false)}
                onLeave={() => {
                    if (project) {
                        editorDraftStorage.remove(project.id);
                    }

                    navigate(ROUTES.PROJECTS);
                }}
                onSaveAndLeave={handleSaveAndLeave}
            />
        </>
    );
}
