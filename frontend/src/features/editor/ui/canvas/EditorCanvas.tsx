// src/features/editor/ui/canvas/EditorCanvas.tsx
import type { WorkspaceProject } from '../../../../shared/types/workspace';
import type { EditorScene } from '../../model/editorTypes';
import './EditorCanvas.css';

type EditorCanvasProps = {
    project: WorkspaceProject;
    scene: EditorScene;
    zoom: number;
    onZoomChange: (zoom: number) => void;
};

export function EditorCanvas({
    project,
    scene,
    zoom,
    onZoomChange,
}: EditorCanvasProps) {
    const canvasScale = zoom / 100;

    const handleZoomIn = () => {
        onZoomChange(Math.min(200, zoom + 10));
    };

    const handleZoomOut = () => {
        onZoomChange(Math.max(20, zoom - 10));
    };

    return (
        <section className="editor-canvas-area">
            <div className="editor-canvas-area__stage">
                <div
                    className="editor-canvas"
                    style={{
                        width: project.canvasWidth,
                        height: project.canvasHeight,
                        background: scene.background.color,
                        transform: `scale(${canvasScale})`,
                    }}
                />
            </div>

            <button className="editor-canvas__color-button" type="button">
                <span />
            </button>

            <div className="editor-zoom-controls">
                <button type="button" onClick={handleZoomIn}>
                    +
                </button>
                <button type="button" onClick={handleZoomOut}>
                    −
                </button>
                <strong>{zoom}%</strong>
            </div>
        </section>
    );
}
