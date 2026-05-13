// src/features/editor/ui/canvas/EditorCanvas.tsx
import { useEffect, useMemo, useRef } from 'react';
import type { WorkspaceProject } from '../../../../shared/types/workspace';
import type { EditorOption, EditorScene } from '../../model/editorTypes';
import {
    getActiveDrawingTool,
    useCanvasDrawing,
} from '../panels/tools-panel/canvasDrawing';
import { useCanvasScene } from './canvasScene';
import {
    getActiveShapeType,
    placeShapeOnCanvas,
} from '../panels/shapes-panel/canvasShape';
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
    selectedObjectIds: string[];
    onObjectSelect: (objectIds: string[]) => void;
    onOptionChange: (option: EditorOption) => void;
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
    selectedObjectIds,
    onObjectSelect,
    onOptionChange,
}: EditorCanvasProps) {
    const canvasAreaRef = useRef<HTMLElement | null>(null);
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const latestSceneRef = useRef(scene);

    const activeShapeType = useMemo(
        () => getActiveShapeType(activeOption),
        [activeOption],
    );

    const { canvasScale, handleZoomIn, handleZoomOut } = useEditorCanvasZoom({
        zoom,
        onZoomChange,
        canvasAreaRef,
    });

    const activeDrawingTool = getActiveDrawingTool(activeOption);

    const renderScene: EditorScene = {
        ...scene,
        objects: scene.objects,
    };

    const { canvasInstanceRef } = useCanvasScene({
        scene: renderScene,
        canvasWidth: project.canvasWidth,
        canvasHeight: project.canvasHeight,
        selectedObjectIds,
        onObjectSelect,
        canvasElementRef: fabricCanvasRef,
        onSceneCommit,
        isInteractionDisabled: Boolean(activeDrawingTool || activeShapeType),
    });

    const { handlePointerDown, handlePointerMove, handlePointerUp } =
        useCanvasDrawing({
            scene,
            activeOption,
            toolColors,
            toolStrokeWidths,
            canvasScale,
            canvasRef,
            canvasInstanceRef,
            getLatestScene: () => latestSceneRef.current,
            onSceneCommit,
        });

    useEffect(() => {
        latestSceneRef.current = scene;
    }, [scene]);

    const handleShapePlacement = (
        event: React.PointerEvent<HTMLDivElement>,
    ) => {
        return placeShapeOnCanvas({
            event,
            activeShapeType,
            canvasScale,
            canvasRef,
            getLatestScene: () => latestSceneRef.current,
            onSceneCommit,
            onObjectSelect,
            onOptionChange,
        });
    };

    return (
        <section className="editor-canvas-area" ref={canvasAreaRef}>
            <div className="editor-canvas-area__stage">
                <div
                    ref={canvasRef}
                    className={`editor-canvas ${
                        activeDrawingTool ? 'editor-canvas--drawing' : ''
                    } ${activeShapeType ? 'editor-canvas--placing-shape' : ''}`}
                    role="button"
                    tabIndex={0}
                    onPointerDown={(event) => {
                        if (activeDrawingTool === 'eraser') {
                            handlePointerDown(event);
                            return;
                        }

                        handleShapePlacement(event);
                    }}
                    onPointerMove={(event) => {
                        if (activeDrawingTool === 'eraser') {
                            handlePointerMove(event);
                        }
                    }}
                    onPointerUp={(event) => {
                        if (activeDrawingTool === 'eraser') {
                            handlePointerUp(event);
                        }
                    }}
                    onPointerCancel={(event) => {
                        if (activeDrawingTool === 'eraser') {
                            handlePointerUp(event);
                        }
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
                    <canvas
                        ref={fabricCanvasRef}
                        className="editor-canvas__fabric-layer"
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
