// src/features/editor/ui/canvas/EditorCanvas.tsx
import { useEffect, useRef } from 'react';
import type { WorkspaceProject } from '../../../../shared/types/workspace';
import type { EditorOption, EditorScene } from '../../model/editorTypes';
import {
    DrawingLayer,
    useCanvasDrawing,
} from '../panels/tools-panel/drawing/EditorCanvasDrawing';
import { useCanvasObjectSelection } from './selection/useCanvasObjectSelection';
import { useEditorCanvasZoom } from './zoom/useEditorCanvasZoom';
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
    selectedObjectId: string | null;
    onObjectSelect: (objectId: string | null) => void;
};

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
    selectedObjectId,
    onObjectSelect,
}: EditorCanvasProps) {
    const canvasAreaRef = useRef<HTMLElement | null>(null);
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const latestSceneRef = useRef(scene);

    const { canvasScale, handleZoomIn, handleZoomOut } = useEditorCanvasZoom({
        zoom,
        onZoomChange,
        canvasAreaRef,
    });

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

    const {
        visibleScene,
        handleSelectionPointerDown,
        handleSelectionPointerMove,
        handleSelectionPointerUp,
    } = useCanvasObjectSelection({
        scene,
        canvasScale,
        canvasRef,
        selectedObjectId,
        getLatestScene: () => latestSceneRef.current,
        onObjectSelect,
        onSceneCommit,
    });

    useEffect(() => {
        latestSceneRef.current = scene;
    }, [scene]);

    const handleCanvasClick = () => {
        if (!activeDrawingTool) {
            onCanvasSelect();
        }
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
                    onPointerDown={(event) => {
                        if (activeDrawingTool) {
                            handlePointerDown(event);
                            return;
                        }

                        handleSelectionPointerDown(event);
                    }}
                    onPointerMove={(event) => {
                        if (activeDrawingTool) {
                            handlePointerMove(event);
                            return;
                        }

                        handleSelectionPointerMove(event);
                    }}
                    onPointerUp={(event) => {
                        if (activeDrawingTool) {
                            handlePointerUp(event);
                            return;
                        }

                        handleSelectionPointerUp(event);
                    }}
                    onPointerCancel={(event) => {
                        if (activeDrawingTool) {
                            handlePointerUp(event);
                            return;
                        }

                        handleSelectionPointerUp(event);
                    }}
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
                        objects={
                            activeDrawingTool
                                ? visibleObjects
                                : visibleScene.objects
                        }
                        selectedObjectId={selectedObjectId}
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
