// src/pages/editor-page/EditorPage.tsx
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { projectsApi } from '../../shared/api/projectsApi';
import { templatesApi } from '../../shared/api/templatesApi';
import { ApiError } from '../../shared/api/apiClient';
import { authStorage } from '../../shared/auth/authStorage';
import type {
    WorkspaceProject,
    WorkspaceTemplate,
} from '../../shared/types/workspace';
import { ROUTES } from '../../shared/routes/routes';

import {
    CreateProjectModal,
    type CreateProjectFormValues,
} from '../../features/workspace/ui/create-project-modal';

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
import { useEditorProjectSave } from '../../features/editor/model/useEditorProjectSave';

import { useEditorHistory } from '../../features/editor/model/useEditorHistory';
import { editorDraftStorage } from '../../features/editor/model/editorDraftStorage';

import {
    SaveProjectModal,
    type SaveProjectOptions,
} from '../../features/editor/ui/modals/save-project-modal';
import { UnsavedChangesModal } from '../../features/editor/ui/modals/unsaved-changes-modal';
import { useRecentColors } from '../../features/editor/ui/color-picker/useRecentColors';
import { duplicateEditorObject } from '../../features/editor/ui/duplicate/editorObjectActions';
import { toggleEditorObjectLock } from '../../features/editor/ui/lock/toggleEditorObjectLock';
import { deleteEditorObject } from '../../features/editor/ui/delete/deleteEditorObject';

import './EditorPage.css';

export function EditorPage() {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();

    const [project, setProject] = useState<WorkspaceProject | null>(null);

    const [activePanel, setActivePanel] = useState<EditorPanel>(null);
    const [activeOption, setActiveOption] = useState<EditorOption>(null);

    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
        null,
    );
    
    const updateSelectedObjectColor = (color: string): EditorScene => {
    if (!selectedObjectId) {
        return scene;
    }

    return {
        ...scene,
        objects: scene.objects.map((object) => {
            if (object.id !== selectedObjectId) {
                return object;
            }

            if (object.locked) {
                return object;
            }

            if (object.type === 'draw') {
                return {
                    ...object,
                    color,
                };
            }

            if (object.type === 'shape') {
                return {
                    ...object,
                    color,
                };
            }

            return object;
        }),
    };
};

    const handleSelectedObjectColorChangeStart = () => {
        startSceneTransaction();
    };

    const handleSelectedObjectColorPreview = (color: string) => {
        previewScene(updateSelectedObjectColor(color));
    };

    const handleSelectedObjectColorCommit = (color: string) => {
        previewScene(updateSelectedObjectColor(color));
        commitSceneTransaction();
        addRecentColor(color);
    };
    const [toolColors, setToolColors] = useState<Record<string, string>>({
        pencil: '#98BA61',
        marker: '#F8A1C4',
        highliter: '#48D8FE',
        eraser: '#FE5F96',
    });

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

    const { recentColors, addRecentColor, restoreRecentColors } =
        useRecentColors();

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

    const { isSaving, saveProject } = useEditorProjectSave({
        project,
        linkedTemplate,
        scene,
        onProjectSaved: (updatedProject) => {
            setProject(updatedProject);
            setIsMetaDirty(false);
        },
        onTemplateSaved: (template) => {
            setLinkedTemplate(template);

            setSaveProjectOptions({
                saveAsTemplate: Boolean(template),
                isPublic: template?.isPublic ?? false,
            });
        },
        onSceneSaved: markSceneAsSaved,
        onSaveModalClose: () => {
            setIsSaveModalOpen(false);

            if (shouldLeaveAfterSave) {
                setShouldLeaveAfterSave(false);
                navigate(ROUTES.PROJECTS);
            }
        },
    });

    const isDirty = isSceneDirty || isMetaDirty;

    useEffect(() => {
    if (!project || isRestoringDraftRef.current) {
        return;
    }

    if (!isSceneDirty) {
        editorDraftStorage.remove(project.id);
        return;
    }

    editorDraftStorage.set({
        projectId: project.id,
        scene,
        pastScenes,
        futureScenes,
        recentColors,
        activePanel,
        activeOption,
    });
}, [
    project,
    scene,
    pastScenes,
    futureScenes,
    recentColors,
    activePanel,
    activeOption,
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
                setLinkedTemplate(existingTemplate);

                isRestoringDraftRef.current = true;

                resetScene(normalizedScene, true);

                if (draft) {
                    restoreDraftHistory({
                        scene: draft.scene,
                        pastScenes: draft.pastScenes,
                        futureScenes: draft.futureScenes,
                    });

                    setActivePanel(draft.activePanel);
                    setActiveOption(draft.activeOption);

                    if (draft.recentColors.length > 0) {
                        restoreRecentColors(draft.recentColors);
                    }
                }

                queueMicrotask(() => {
                    isRestoringDraftRef.current = false;
                });

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

    const handleSelectedObjectDelete = () => {
        if (!selectedObjectId) {
            return;
        }

        const result = deleteEditorObject(scene, selectedObjectId);

        if (!result.deleted) {
            return;
        }

        applySceneChange(result.scene);
        setSelectedObjectId(null);
    };

    const handleSelectedObjectLockToggle = () => {
        if (!selectedObjectId) {
            return;
        }

        const result = toggleEditorObjectLock(scene, selectedObjectId);

        if (!result.updatedObject) {
            return;
        }

        applySceneChange(result.scene);
    };

    const handleSelectedObjectDuplicate = () => {
        if (!selectedObjectId) {
            return;
        }

        const result = duplicateEditorObject(scene, selectedObjectId);

        if (!result.duplicatedObject) {
            return;
        }

        applySceneChange(result.scene);
        setSelectedObjectId(result.duplicatedObject.id);
    };

    const handleOptionChange = (option: EditorOption) => {
        setActiveOption(option);

        if (option?.panel === 'tools' && option.id !== 'cursor') {
            setSelectedObjectId(null);
        }
    };

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

        addRecentColor(color);
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

        addRecentColor(color);
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
                selectedObjectId={selectedObjectId}
                recentColors={recentColors}
                toolColors={toolColors}
                toolStrokeWidths={toolStrokeWidths}
                zoom={zoom}
                isDirty={isDirty}
                isSaving={isSaving}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
                onPanelChange={handlePanelChange}
                onOptionChange={handleOptionChange}
                onObjectSelect={setSelectedObjectId}
                onSceneCommit={(nextScene) => applySceneChange(nextScene)}
                onToolColorPreview={handleToolColorPreview}
                onToolColorCommit={handleToolColorCommit}
                onToolStrokeWidthChange={handleToolStrokeWidthChange}
                onSelectedObjectColorChangeStart={
                    handleSelectedObjectColorChangeStart
                }
                onSelectedObjectColorPreview={handleSelectedObjectColorPreview}
                onSelectedObjectColorCommit={handleSelectedObjectColorCommit}
                onCanvasBackgroundChangeStart={
                    handleCanvasBackgroundChangeStart
                }
                onCanvasBackgroundPreview={handleCanvasBackgroundPreview}
                onCanvasBackgroundCommit={handleCanvasBackgroundCommit}
                onZoomChange={setZoom}
                onOpenProjectSettings={() => setIsEditModalOpen(true)}
                onOpenSaveProject={() => setIsSaveModalOpen(true)}
                onBack={handleBack}
                onSelectedObjectDuplicate={handleSelectedObjectDuplicate}
                onSelectedObjectLockToggle={handleSelectedObjectLockToggle}
                onSelectedObjectDelete={handleSelectedObjectDelete}
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
                    setShouldLeaveAfterSave(false);
                    setIsSaveModalOpen(false);
                }}
                onSave={saveProject}
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
