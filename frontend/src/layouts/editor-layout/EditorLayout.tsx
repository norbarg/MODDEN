// src/layouts/editor-layout/EditorLayout.tsx
import type { WorkspaceProject } from '../../shared/types/workspace';
import type {
    EditorOption,
    EditorPanel,
    EditorScene,
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
    recentCanvasColors: string[];
    toolColors: Record<string, string>;
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
    onCanvasBackgroundChangeStart: () => void;
    onCanvasBackgroundPreview: (color: string) => void;
    onCanvasBackgroundCommit: (color: string) => void;
    onZoomChange: (zoom: number) => void;
    onOpenProjectSettings: () => void;
    onOpenSaveProject: () => void;
    onBack: () => void;
    toolStrokeWidths: Record<string, number>;
    recentToolColors: string[];
    onToolColorPreview: (toolId: string, color: string) => void;
    onToolColorCommit: (toolId: string, color: string) => void;
    onToolStrokeWidthChange: (toolId: string, strokeWidth: number) => void;
};

export function EditorLayout({
    project,
    scene,
    activePanel,
    activeOption,
    recentCanvasColors,
    toolColors,
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
    onCanvasBackgroundChangeStart,
    onCanvasBackgroundPreview,
    onCanvasBackgroundCommit,
    onZoomChange,
    onOpenProjectSettings,
    onOpenSaveProject,
    onBack,
    toolStrokeWidths,
    recentToolColors,
    onToolColorPreview,
    onToolColorCommit,
    onToolStrokeWidthChange,
}: EditorLayoutProps) {
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
                        toolColors={toolColors}
                        toolStrokeWidths={toolStrokeWidths}
                        recentToolColors={recentToolColors}
                        onOptionChange={onOptionChange}
                        onToolColorPreview={onToolColorPreview}
                        onToolColorCommit={onToolColorCommit}
                        onToolStrokeWidthChange={onToolStrokeWidthChange}
                    />

                    <div className="editor-layout__canvas-wrap">
                        <EditorSubHeader
                            scene={scene}
                            activeOption={activeOption}
                            recentCanvasColors={recentCanvasColors}
                            onCanvasBackgroundChangeStart={
                                onCanvasBackgroundChangeStart
                            }
                            onCanvasBackgroundPreview={
                                onCanvasBackgroundPreview
                            }
                            onCanvasBackgroundCommit={onCanvasBackgroundCommit}
                        />

                        <EditorCanvas
                            project={project}
                            scene={scene}
                            activeOption={activeOption}
                            toolColors={toolColors}
                            toolStrokeWidths={toolStrokeWidths}
                            zoom={zoom}
                            onZoomChange={onZoomChange}
                            onCanvasSelect={() => onOptionChange(null)}
                            onSceneCommit={onSceneCommit}
                        />
                    </div>
                </div>
            </section>
        </main>
    );
}
