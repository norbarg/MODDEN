// src/features/editor/ui/canvas/EditorCanvas.tsx
import { useEffect, useMemo, useRef } from 'react';
import type { WorkspaceProject } from '../../../../shared/types/workspace';
import type {
    EditorOption,
    EditorScene,
    EditorShapeObject,
    EditorShapeType,
} from '../../model/editorTypes';
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
    onOptionChange: (option: EditorOption) => void;
};

const SHAPE_TYPES: EditorShapeType[] = [
    'square',
    'triangle',
    'circle',
    'diamond',
    'pentagon',
];

function createShapeId() {
    return `shape_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isShapeType(value: string): value is EditorShapeType {
    return SHAPE_TYPES.includes(value as EditorShapeType);
}

function createShapeObject(
    shapeType: EditorShapeType,
    x: number,
    y: number,
): EditorShapeObject {
    const defaultSize = shapeType === 'triangle' ? 120 : 110;

    return {
        id: createShapeId(),
        type: 'shape',
        shapeType,
        x: x - defaultSize / 2,
        y: y - defaultSize / 2,
        width: defaultSize,
        height: defaultSize,
        rotation: 0,
        color: '#dcd9d9ff',
    };
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
    selectedObjectId,
    onObjectSelect,
    onOptionChange,
}: EditorCanvasProps) {
    const canvasAreaRef = useRef<HTMLElement | null>(null);
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const latestSceneRef = useRef(scene);

    const activeShapeType = useMemo(() => {
        if (
            activeOption?.panel === 'shapes' &&
            isShapeType(activeOption.id)
        ) {
            return activeOption.id;
        }

        return null;
    }, [activeOption]);

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

    const getCanvasPoint = (event: React.PointerEvent<HTMLDivElement>) => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return null;
        }

        const rect = canvas.getBoundingClientRect();

        return {
            x: (event.clientX - rect.left) / canvasScale,
            y: (event.clientY - rect.top) / canvasScale,
        };
    };

    const handleShapePlacement = (
    event: React.PointerEvent<HTMLDivElement>,
) => {
    if (!activeShapeType) {
        return false;
    }

    const point = getCanvasPoint(event);

    if (!point) {
        return false;
    }

    event.preventDefault();
    event.stopPropagation();

    const newShape = createShapeObject(activeShapeType, point.x, point.y);
    const latestScene = latestSceneRef.current;

    onSceneCommit({
        ...latestScene,
        objects: [...latestScene.objects, newShape],
    });

    onObjectSelect(newShape.id);
    onOptionChange(null);

    return true;
};

    const handleCanvasClick = () => {
        if (!activeDrawingTool && !activeShapeType) {
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
                    } ${activeShapeType ? 'editor-canvas--placing-shape' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={handleCanvasClick}
                    onPointerDown={(event) => {
                        if (activeDrawingTool) {
                            handlePointerDown(event);
                            return;
                        }

                        if (handleShapePlacement(event)) {
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
