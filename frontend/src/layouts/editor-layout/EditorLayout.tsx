// src/layouts/editor-layout/EditorLayout.tsx
import type { WorkspaceProject } from '../../shared/types/workspace';
import type {
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
    zoom: number;
    onPanelChange: (panel: EditorPanel) => void;
    onZoomChange: (zoom: number) => void;
};

export function EditorLayout({
    project,
    scene,
    activePanel,
    zoom,
    onPanelChange,
    onZoomChange,
}: EditorLayoutProps) {
    return (
        <main className="editor-layout">
            <EditorSidebar
                activePanel={activePanel}
                onPanelChange={onPanelChange}
            />

            <section className="editor-layout__workspace">
                <EditorHeader project={project} />

                <EditorSubHeader activePanel={activePanel} />

                <div className="editor-layout__body">
                    <EditorSubSidebar activePanel={activePanel} />

                    <EditorCanvas
                        project={project}
                        scene={scene}
                        zoom={zoom}
                        onZoomChange={onZoomChange}
                    />
                </div>
            </section>
        </main>
    );
}
