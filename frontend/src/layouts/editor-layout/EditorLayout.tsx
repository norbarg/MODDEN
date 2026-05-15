// src/layouts/editor-layout/EditorLayout.tsx
import type { WorkspaceProject } from '../../shared/types/workspace';
import type {
    EditorImageFilterValues,
    EditorOption,
    EditorPanel,
    EditorScene,
    EditorUploadedImage,
    EditorTextObject,
} from '../../features/editor/model/editorTypes';
import { EditorSidebar } from '../../widgets/editor-sidebar/EditorSidebar';
import { EditorHeader } from '../../widgets/editor-header/EditorHeader';
import { EditorSubHeader } from '../../widgets/editor-subheader/EditorSubHeader';
import { EditorSubSidebar } from '../../widgets/editor-subsidebar/EditorSubSidebar';
import { EditorCanvas } from '../../features/editor/ui/canvas/EditorCanvas';
import './EditorLayout.css';

type EditorLayoutProps = {
    project: WorkspaceProject;
    scene: EditorScene;
    activePanel: EditorPanel;
    activeOption: EditorOption;
    uploadedImages: EditorUploadedImage[];
    isUploadingImages: boolean;
    recentColors: string[];
    toolColors: Record<string, string>;
    toolStrokeWidths: Record<string, number>;
    zoom: number;
    isDirty: boolean;
    isSaving: boolean;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onPanelChange: (panel: EditorPanel) => void;
    onOptionChange: (option: EditorOption) => void;
    onSceneCommit: (scene: EditorScene) => void;
    onImagesUpload: (files: File[]) => Promise<void>;
    onUploadedImagePlace: (
        image: EditorUploadedImage,
        dropPoint?: { x: number; y: number },
    ) => Promise<void>;
    onUploadedImageDelete: (imageId: string) => Promise<void>;
    onToolColorPreview: (toolId: string, color: string) => void;
    onToolColorCommit: (toolId: string, color: string) => void;
    onToolStrokeWidthChange: (toolId: string, strokeWidth: number) => void;
    onCanvasBackgroundChangeStart: () => void;
    onCanvasBackgroundPreview: (color: string) => void;
    onCanvasBackgroundCommit: (color: string) => void;
    onZoomChange: (zoom: number) => void;
    onOpenProjectSettings: () => void;
    onOpenSaveProject: () => void;
    onBack: () => void;
    selectedObjectIds: string[];
    onObjectSelect: (objectIds: string[]) => void;
    onSelectedObjectColorChangeStart: () => void;
    onSelectedObjectColorPreview: (color: string) => void;
    onSelectedObjectColorCommit: (color: string) => void;
    onSelectedImageFiltersChange: (filters: EditorImageFilterValues) => void;
    onSelectedObjectDuplicate: () => void;
    onSelectedObjectLockToggle: () => void;
    onSelectedObjectDelete: () => void;
    onSelectedTextChange: (changes: Partial<EditorTextObject>) => void;
    onSelectedTextColorChangeStart: () => void;
    onSelectedTextColorPreview: (color: string) => void;
    onSelectedTextColorCommit: (color: string) => void;
};

export function EditorLayout({
    project,
    scene,
    activePanel,
    activeOption,
    uploadedImages,
    isUploadingImages,
    recentColors,
    toolColors,
    toolStrokeWidths,
    zoom,
    isDirty,
    isSaving,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onPanelChange,
    onOptionChange,
    onSceneCommit,
    onImagesUpload,
    onUploadedImagePlace,
    onUploadedImageDelete,
    onToolColorPreview,
    onToolColorCommit,
    onToolStrokeWidthChange,
    onCanvasBackgroundChangeStart,
    onCanvasBackgroundPreview,
    onCanvasBackgroundCommit,
    onZoomChange,
    onOpenProjectSettings,
    onOpenSaveProject,
    onBack,
    selectedObjectIds,
    onObjectSelect,
    onSelectedObjectColorChangeStart,
    onSelectedObjectColorPreview,
    onSelectedObjectColorCommit,
    onSelectedImageFiltersChange,
    onSelectedObjectDuplicate,
    onSelectedObjectLockToggle,
    onSelectedObjectDelete,
    onSelectedTextChange,
    onSelectedTextColorChangeStart,
    onSelectedTextColorPreview,
    onSelectedTextColorCommit,
}: EditorLayoutProps) {
    const selectedObjects = scene.objects.filter((object) =>
        selectedObjectIds.includes(object.id),
    );

    const selectedObject =
        selectedObjects.length === 1 ? selectedObjects[0] : null;

    return (
        <main className="editor-layout">
            <EditorSidebar
                activePanel={activePanel}
                onPanelChange={onPanelChange}
                onBack={onBack}
            />

            <section className="editor-layout__workspace">
                <EditorHeader
                    project={project}
                    isDirty={isDirty}
                    isSaving={isSaving}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onUndo={onUndo}
                    onRedo={onRedo}
                    onOpenProjectSettings={onOpenProjectSettings}
                    onOpenSaveProject={onOpenSaveProject}
                />

                <div className="editor-layout__body">
                    <EditorSubSidebar
                        activePanel={activePanel}
                        activeOption={activeOption}
                        uploadedImages={uploadedImages}
                        isUploadingImages={isUploadingImages}
                        toolColors={toolColors}
                        toolStrokeWidths={toolStrokeWidths}
                        recentToolColors={recentColors}
                        onOptionChange={onOptionChange}
                        onImagesUpload={onImagesUpload}
                        onUploadedImagePlace={(image) =>
                            onUploadedImagePlace(image)
                        }
                        onUploadedImageDelete={onUploadedImageDelete}
                        onToolColorPreview={onToolColorPreview}
                        onToolColorCommit={onToolColorCommit}
                        onToolStrokeWidthChange={onToolStrokeWidthChange}
                    />

                    <div className="editor-layout__canvas-wrap">
                        <EditorSubHeader
                            scene={scene}
                            selectedObject={selectedObject}
                            selectedObjects={selectedObjects}
                            recentCanvasColors={recentColors}
                            onCanvasBackgroundChangeStart={
                                onCanvasBackgroundChangeStart
                            }
                            onCanvasBackgroundPreview={
                                onCanvasBackgroundPreview
                            }
                            onCanvasBackgroundCommit={onCanvasBackgroundCommit}
                            onSelectedObjectColorChangeStart={
                                onSelectedObjectColorChangeStart
                            }
                            onSelectedObjectColorPreview={
                                onSelectedObjectColorPreview
                            }
                            onSelectedObjectColorCommit={
                                onSelectedObjectColorCommit
                            }
                            onSelectedImageFiltersChange={
                                onSelectedImageFiltersChange
                            }
                            onSelectedObjectDuplicate={
                                onSelectedObjectDuplicate
                            }
                            onSelectedObjectLockToggle={
                                onSelectedObjectLockToggle
                            }
                            onSelectedObjectDelete={onSelectedObjectDelete}
                            onSelectedTextChange={onSelectedTextChange}
                            onSelectedTextColorChangeStart={
                                onSelectedTextColorChangeStart
                            }
                            onSelectedTextColorPreview={
                                onSelectedTextColorPreview
                            }
                            onSelectedTextColorCommit={
                                onSelectedTextColorCommit
                            }
                        />

                        <EditorCanvas
                            project={project}
                            scene={scene}
                            activeOption={activeOption}
                            uploadedImages={uploadedImages}
                            toolColors={toolColors}
                            toolStrokeWidths={toolStrokeWidths}
                            zoom={zoom}
                            onZoomChange={onZoomChange}
                            onCanvasSelect={() => onOptionChange(null)}
                            onSceneCommit={onSceneCommit}
                            onUploadedImagePlace={onUploadedImagePlace}
                            selectedObjectIds={selectedObjectIds}
                            onObjectSelect={onObjectSelect}
                            onOptionChange={onOptionChange}
                        />
                    </div>
                </div>
            </section>
        </main>
    );
}
