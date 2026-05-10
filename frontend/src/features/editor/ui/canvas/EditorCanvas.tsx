// src/features/editor/ui/canvas/EditorCanvas.tsx
import { useEffect, useRef } from 'react';
import type { WorkspaceProject } from '../../../../shared/types/workspace';
import type { EditorOption, EditorScene } from '../../model/editorTypes';
import { DrawingLayer, useCanvasDrawing } from './drawing/EditorCanvasDrawing';
import './EditorCanvas.css';

type EditorCanvasProps = {
    project: WorkspaceProject;
    scene: EditorScene;
    activeOption: EditorOption;
    toolColors: Record<string, string>;
    zoom: number;
    onZoomChange: (zoom: number) => void;
    onCanvasSelect: () => void;
    onSceneCommit: (scene: EditorScene) => void;
    toolStrokeWidths: Record<string, number>;
};

const MIN_ZOOM = 20;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;

function clampZoom(value: number) {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function EditorCanvas({
    project,
    scene,
    activeOption,
    toolColors,
    zoom,
    onZoomChange,
    onCanvasSelect,
    onSceneCommit,
    toolStrokeWidths,
}: EditorCanvasProps) {
    const canvasAreaRef = useRef<HTMLElement | null>(null);
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const latestZoomRef = useRef(zoom);
    const latestSceneRef = useRef(scene);

    const canvasScale = zoom / 100;

    const {
        activeDrawingTool,
        visibleObjects,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
    } = useCanvasDrawing({
        scene,
        activeOption,
        toolColors,
        toolStrokeWidths,
        canvasScale,
        canvasRef,
        getLatestScene: () => latestSceneRef.current,
        onSceneCommit,
    });

    useEffect(() => {
        latestZoomRef.current = zoom;
    }, [zoom]);

    useEffect(() => {
        latestSceneRef.current = scene;
    }, [scene]);

    useEffect(() => {
        const canvasArea = canvasAreaRef.current;

        if (!canvasArea) {
            return;
        }

        const handleWheel = (event: WheelEvent) => {
            if (!event.ctrlKey && !event.metaKey) {
                return;
            }

            event.preventDefault();

            const zoomDirection = event.deltaY < 0 ? 1 : -1;
            const nextZoom = clampZoom(
                latestZoomRef.current + zoomDirection * ZOOM_STEP,
            );

            onZoomChange(nextZoom);
        };

        canvasArea.addEventListener('wheel', handleWheel, {
            passive: false,
        });

        return () => {
            canvasArea.removeEventListener('wheel', handleWheel);
        };
    }, [onZoomChange]);

    const handleCanvasClick = () => {
        if (!activeDrawingTool) {
            onCanvasSelect();
        }
    };

    const handleZoomIn = () => {
        onZoomChange(clampZoom(zoom + ZOOM_STEP));
    };

    const handleZoomOut = () => {
        onZoomChange(clampZoom(zoom - ZOOM_STEP));
    };

    return (
        <section className="editor-canvas-area" ref={canvasAreaRef}>
            <div className="editor-canvas-area__stage">
                <div
                    ref={canvasRef}
                    className={`editor-canvas ${
                        activeDrawingTool ? 'editor-canvas--drawing' : ''
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={handleCanvasClick}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            onCanvasSelect();
                        }
                    }}
                    style={{
                        width: project.canvasWidth,
                        height: project.canvasHeight,
                        background: scene.background.color,
                        transform: `scale(${canvasScale})`,
                    }}
                >
                    <DrawingLayer
                        objects={visibleObjects}
                        canvasWidth={project.canvasWidth}
                        canvasHeight={project.canvasHeight}
                    />
                </div>
            </div>

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
