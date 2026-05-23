// src/pages/editor-page/EditorPage.tsx
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { projectsApi } from '../../shared/api/projectsApi';
import { templatesApi } from '../../shared/api/templatesApi';
import { ApiError } from '../../shared/api/apiClient';
import { authStorage } from '../../shared/auth/authStorage';
import { assetsApi } from '../../shared/api/assetsApi';
import { createImageObject } from '../../features/editor/ui/panels/uploads-panel/canvasImage';
import { createTextObject } from '../../features/editor/ui/panels/text-panel/canvasText';
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
    EditorImageFilterValues,
    EditorUploadedImage,
    EditorTextObject,
} from '../../features/editor/model/editorTypes';
import { useEditorProjectSave } from '../../features/editor/model/useEditorProjectSave';
import { useEditorKeyboardMove } from '../../features/editor/model/editorKeyboardMove';
import { useEditorHistory } from '../../features/editor/model/useEditorHistory';
import { editorDraftStorage } from '../../features/editor/model/editorDraftStorage';
import { useEditorHotkeys } from '../../features/editor/model/useEditorHotkeys';

import {
    SaveProjectModal,
    type SaveProjectOptions,
} from '../../features/editor/ui/modals/save-project-modal';
import { UnsavedChangesModal } from '../../features/editor/ui/modals/unsaved-changes-modal';
import { ShareProjectModal } from '../../features/editor/ui/modals/share-project-modal';
import { useRecentColors } from '../../features/editor/ui/color-picker/useRecentColors';
import { duplicateEditorObject } from '../../features/editor/ui/duplicate/editorObjectActions';
import { exportCanvasThumbnail } from '../../features/editor/ui/canvas/exportCanvasThumbnail';

import {
    exportEditorScene,
    type EditorExportFormat,
} from '../../features/editor/export/exportEditorScene';

import './EditorPage.css';

export function EditorPage() {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();

    const [project, setProject] = useState<WorkspaceProject | null>(null);

    const [activePanel, setActivePanel] = useState<EditorPanel>(null);
    const [activeOption, setActiveOption] = useState<EditorOption>(null);

    const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);

    const [uploadedImages, setUploadedImages] = useState<EditorUploadedImage[]>(
        [],
    );
    const [isUploadingImages, setIsUploadingImages] = useState(false);

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const [isHotkeyHintsVisible, setIsHotkeyHintsVisible] = useState(false);

    const lastSaveProjectOptionsRef = useRef<SaveProjectOptions | null>(null);

    const selectedObjectId =
        selectedObjectIds.length === 1 ? selectedObjectIds[0] : null;

    const updateSelectedObjectColor = (color: string): EditorScene => {
        if (selectedObjectIds.length === 0) {
            return scene;
        }

        const selectedIds = new Set(selectedObjectIds);
        return {
            ...scene,
            objects: scene.objects.map((object) => {
                if (!selectedIds.has(object.id)) {
                    return object;
                }

                if (object.locked) {
                    return object;
                }

                if (
                    object.type !== 'shape' &&
                    object.type !== 'draw' &&
                    object.type !== 'text'
                ) {
                    return object;
                }

                return {
                    ...object,
                    color,
                };
            }),
        };
    };

    function areStringArraysEqual(first: string[], second: string[]) {
        if (first.length !== second.length) {
            return false;
        }

        return first.every((value, index) => value === second[index]);
    }

    const handleObjectSelect = (objectIds: string[]) => {
        colorEditingObjectIdRef.current = null;

        setSelectedObjectIds((currentObjectIds) => {
            if (areStringArraysEqual(currentObjectIds, objectIds)) {
                return currentObjectIds;
            }

            return objectIds;
        });
    };

    const handleSelectedObjectColorChangeStart = () => {
        colorEditingObjectIdRef.current = selectedObjectId;
        startSceneTransaction();
    };

    const handleSelectedObjectColorPreview = (color: string) => {
        previewScene(updateSelectedObjectColor(color));
    };

    const handleSelectedObjectColorCommit = (color: string) => {
        previewScene(updateSelectedObjectColor(color));
        commitSceneTransaction();
        addRecentColor(color);

        colorEditingObjectIdRef.current = null;
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
        eraser: 1,
    });

    const [zoom, setZoom] = useState(100);
    const [isLoading, setIsLoading] = useState(true);

    const [isMetaDirty, setIsMetaDirty] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
    const [shouldLeaveAfterSave, setShouldLeaveAfterSave] = useState(false);

    const [isSavingProject, setIsSavingProject] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

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
    const colorEditingObjectIdRef = useRef<string | null>(null);

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
        getThumbnailUrl: () => {
            if (!project) {
                return null;
            }

            return exportCanvasThumbnail({
                project,
                scene,
            });
        },
        onProjectSaved: (updatedProject) => {
            setProject(updatedProject);
            setIsMetaDirty(false);
        },
        onTemplateSaved: (template) => {
            setLinkedTemplate(template);

            const nextOptions: SaveProjectOptions = {
                saveAsTemplate: Boolean(template),
                isPublic: template?.isPublic ?? false,
            };

            lastSaveProjectOptionsRef.current = nextOptions;
            setSaveProjectOptions(nextOptions);
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

    const getCurrentSaveOptions = (): SaveProjectOptions => {
        if (lastSaveProjectOptionsRef.current) {
            return lastSaveProjectOptionsRef.current;
        }

        return {
            saveAsTemplate: Boolean(linkedTemplate),
            isPublic: linkedTemplate?.isPublic ?? false,
        };
    };

    const openSaveProjectModal = () => {
        setSaveProjectOptions(getCurrentSaveOptions());
        setIsSaveModalOpen(true);
    };

    const handleSaveProjectWithOptions = async (
        options: SaveProjectOptions,
    ) => {
        const normalizedOptions: SaveProjectOptions = {
            saveAsTemplate: options.saveAsTemplate,
            isPublic: options.saveAsTemplate ? options.isPublic : false,
        };

        lastSaveProjectOptionsRef.current = normalizedOptions;
        setSaveProjectOptions(normalizedOptions);

        await saveProject(normalizedOptions);
    };

    const isDirty = isSceneDirty || isMetaDirty;

    useEditorKeyboardMove({
        selectedObjectIds,
        isDisabled: isEditModalOpen || isSaveModalOpen || isUnsavedModalOpen,
        startSceneTransaction,
        previewScene,
        commitSceneTransaction,
    });

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

                const [loadedProject, myTemplates, myAssets] =
                    await Promise.all([
                        projectsApi.getProject(currentProjectId),
                        templatesApi.getMyTemplates(),
                        assetsApi.getMyAssets(),
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

                setUploadedImages(
                    myAssets.map((asset) => ({
                        id: asset.id,
                        src: asset.fileUrl,
                        fileName:
                            asset.fileUrl.split('/').pop() ?? 'Uploaded image',
                    })),
                );

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

                const loadedSaveOptions: SaveProjectOptions = {
                    saveAsTemplate: Boolean(existingTemplate),
                    isPublic: existingTemplate?.isPublic ?? false,
                };

                lastSaveProjectOptionsRef.current = existingTemplate
                    ? loadedSaveOptions
                    : null;

                setSaveProjectOptions(loadedSaveOptions);

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

    const handleImagesUpload = async (files: File[]) => {
        setIsUploadingImages(true);

        try {
            const uploadedAssets = await Promise.all(
                files.map((file) => assetsApi.uploadAsset(file)),
            );

            const nextImages: EditorUploadedImage[] = uploadedAssets.map(
                ({ asset }) => ({
                    id: asset.id,
                    src: asset.fileUrl,
                    fileName:
                        asset.fileUrl.split('/').pop() ?? 'Uploaded image',
                }),
            );

            setUploadedImages((currentImages) => [
                ...nextImages,
                ...currentImages,
            ]);
        } catch (err) {
            console.error(err);
        } finally {
            setIsUploadingImages(false);
        }
    };

    const handleUploadedImageDelete = async (imageId: string) => {
        try {
            await assetsApi.deleteAsset(imageId);

            setUploadedImages((currentImages) =>
                currentImages.filter((image) => image.id !== imageId),
            );

            applySceneChange({
                ...scene,
                objects: scene.objects.filter((object) => {
                    if (object.type !== 'image') {
                        return true;
                    }

                    return object.assetId !== imageId;
                }),
            });

            setSelectedObjectIds((currentIds) =>
                currentIds.filter((id) => {
                    const selectedObject = scene.objects.find(
                        (object) => object.id === id,
                    );

                    if (!selectedObject || selectedObject.type !== 'image') {
                        return true;
                    }

                    return selectedObject.assetId !== imageId;
                }),
            );
        } catch (err) {
            console.error(err);
        }
    };

    const handleUploadedImagePlace = async (
        image: EditorUploadedImage,
        dropPoint?: { x: number; y: number },
    ) => {
        if (!project) {
            return;
        }

        const imageObject = await createImageObject({
            upload: image,
            canvasWidth: project.canvasWidth,
            canvasHeight: project.canvasHeight,
            dropPoint,
        });

        applySceneChange({
            ...scene,
            objects: [...scene.objects, imageObject],
        });

        setSelectedObjectIds([imageObject.id]);
        setActiveOption(null);
    };

    const handleSelectedImageFiltersChange = (
        filters: EditorImageFilterValues,
    ) => {
        if (!selectedObjectId) {
            return;
        }

        applySceneChange({
            ...scene,
            objects: scene.objects.map((object) => {
                if (
                    object.id !== selectedObjectId ||
                    object.type !== 'image' ||
                    object.locked
                ) {
                    return object;
                }

                return {
                    ...object,
                    filters,
                };
            }),
        });
    };

    const handleSelectedTextChange = (changes: Partial<EditorTextObject>) => {
        applySceneChange(updateSelectedTextObject(changes));
    };

    const handleSelectedTextColorChangeStart = () => {
        startSceneTransaction();
    };

    const handleSelectedTextColorPreview = (color: string) => {
        previewScene(updateSelectedTextObject({ color }));
    };

    const handleSelectedTextColorCommit = (color: string) => {
        previewScene(updateSelectedTextObject({ color }));
        commitSceneTransaction();
        addRecentColor(color);
    };

    const updateSelectedTextObject = (
        changes: Partial<EditorTextObject>,
    ): EditorScene => {
        if (!selectedObjectId) {
            return scene;
        }

        return {
            ...scene,
            objects: scene.objects.map((object) => {
                if (
                    object.id !== selectedObjectId ||
                    object.type !== 'text' ||
                    object.locked
                ) {
                    return object;
                }

                return {
                    ...object,
                    ...changes,
                };
            }),
        };
    };

    const handleSelectedObjectDelete = () => {
        if (selectedObjectIds.length === 0) {
            return;
        }

        const selectedIds = new Set(selectedObjectIds);

        const nextScene: EditorScene = {
            ...scene,
            objects: scene.objects.filter((object) => {
                if (!selectedIds.has(object.id)) {
                    return true;
                }

                return Boolean(object.locked);
            }),
        };

        applySceneChange(nextScene);
        setSelectedObjectIds([]);
    };

    const handleSelectedObjectLockToggle = () => {
        if (selectedObjectIds.length === 0) {
            return;
        }

        const selectedIds = new Set(selectedObjectIds);

        const selectedObjects = scene.objects.filter((object) =>
            selectedIds.has(object.id),
        );

        const shouldLock = selectedObjects.some((object) => !object.locked);

        const nextScene: EditorScene = {
            ...scene,
            objects: scene.objects.map((object) => {
                if (!selectedIds.has(object.id)) {
                    return object;
                }

                return {
                    ...object,
                    locked: shouldLock,
                };
            }),
        };

        applySceneChange(nextScene);
    };

    const handleSelectedObjectDuplicate = () => {
        if (selectedObjectIds.length === 0) {
            return;
        }

        let nextScene = scene;
        const duplicatedIds: string[] = [];

        selectedObjectIds.forEach((objectId) => {
            const result = duplicateEditorObject(nextScene, objectId);

            if (!result.duplicatedObject) {
                return;
            }

            nextScene = result.scene;
            duplicatedIds.push(result.duplicatedObject.id);
        });

        if (duplicatedIds.length === 0) {
            return;
        }

        applySceneChange(nextScene);
        setSelectedObjectIds(duplicatedIds);
    };

    const handleOptionChange = (option: EditorOption) => {
        setActiveOption(option);

        if (option?.panel === 'tools' && option.id !== 'cursor') {
            setSelectedObjectIds([]);
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

    const handleTextAdd = () => {
        if (!project) {
            return;
        }

        const textObject = createTextObject({
            preset: 'paragraph',
            canvasWidth: project.canvasWidth,
            canvasHeight: project.canvasHeight,
        });

        applySceneChange({
            ...scene,
            objects: [...scene.objects, textObject],
        });

        setSelectedObjectIds([textObject.id]);
        setActivePanel(null);
        setActiveOption(null);
    };

    const handlePanelChange = (nextPanel: EditorPanel) => {
        if (nextPanel === 'text') {
            handleTextAdd();
            return;
        }

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

    const handleQuickSave = async () => {
        if (!lastSaveProjectOptionsRef.current) {
            openSaveProjectModal();
            return;
        }

        await handleSaveProjectWithOptions(lastSaveProjectOptionsRef.current);
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
        openSaveProjectModal();
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

    const handleDownloadProject = async (format: EditorExportFormat) => {
        if (!project || isExporting) {
            return;
        }

        setIsExporting(true);

        try {
            await exportEditorScene({
                project,
                scene,
                format,
            });
        } catch (err) {
            console.error(err);

            window.alert(
                'Failed to export project. Please check images on the canvas and try again.',
            );
        } finally {
            setIsExporting(false);
        }
    };

    useEditorHotkeys({
        isDisabled:
            isEditModalOpen ||
            isSaveModalOpen ||
            isUnsavedModalOpen ||
            isShareModalOpen ||
            isLoading,
        isSaving,
        isDirty,
        selectedObjectIds,
        onQuickSave: handleQuickSave,
        onDeleteSelected: handleSelectedObjectDelete,
        onHotkeyHintsVisibleChange: setIsHotkeyHintsVisible,
    });
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
                uploadedImages={uploadedImages}
                isUploadingImages={isUploadingImages}
                isExporting={isExporting}
                onDownloadProject={handleDownloadProject}
                onImagesUpload={handleImagesUpload}
                onUploadedImagePlace={handleUploadedImagePlace}
                onUploadedImageDelete={handleUploadedImageDelete}
                onSelectedImageFiltersChange={handleSelectedImageFiltersChange}
                project={project}
                scene={scene}
                activePanel={activePanel}
                activeOption={activeOption}
                selectedObjectIds={selectedObjectIds}
                onObjectSelect={handleObjectSelect}
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
                onOpenSaveProject={openSaveProjectModal}
                onBack={handleBack}
                onSelectedObjectDuplicate={handleSelectedObjectDuplicate}
                onSelectedObjectLockToggle={handleSelectedObjectLockToggle}
                onSelectedObjectDelete={handleSelectedObjectDelete}
                onSelectedTextChange={handleSelectedTextChange}
                onSelectedTextColorChangeStart={
                    handleSelectedTextColorChangeStart
                }
                onSelectedTextColorPreview={handleSelectedTextColorPreview}
                onSelectedTextColorCommit={handleSelectedTextColorCommit}
                onShareProject={() => setIsShareModalOpen(true)}
                showHotkeyHints={isHotkeyHintsVisible}
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
                onSave={handleSaveProjectWithOptions}
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

            <ShareProjectModal
                isOpen={isShareModalOpen}
                project={project}
                scene={scene}
                onClose={() => setIsShareModalOpen(false)}
            />
        </>
    );
}
