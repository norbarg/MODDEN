// src/features/editor/ui/canvas/EditorCanvas.tsx
import { useEffect, useMemo, useRef } from 'react';
import type { WorkspaceProject } from '../../../../shared/types/workspace';
import type {
    EditorOption,
    EditorScene,
    EditorUploadedImage,
} from '../../model/editorTypes';
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
    uploadedImages: EditorUploadedImage[];
    toolColors: Record<string, string>;
    zoom: number;
    onZoomChange: (zoom: number) => void;
    onCanvasSelect: () => void;
    onSceneCommit: (scene: EditorScene) => void;
    onUploadedImagePlace: (
        image: EditorUploadedImage,
        dropPoint?: { x: number; y: number },
    ) => Promise<void>;
    toolStrokeWidths: Record<string, number>;
    selectedObjectIds: string[];
    onObjectSelect: (objectIds: string[]) => void;
    onOptionChange: (option: EditorOption) => void;
};

export function EditorCanvas({
    project,
    scene,
    activeOption,
    uploadedImages,
    toolColors,
    zoom,
    onZoomChange,
    onCanvasSelect,
    onSceneCommit,
    onUploadedImagePlace,
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

    const { canvasInstanceRef } = useCanvasScene({
        scene,
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

    const getCanvasPoint = (clientX: number, clientY: number) => {
        const canvasElement = canvasRef.current;

        if (!canvasElement) {
            return null;
        }

        const rect = canvasElement.getBoundingClientRect();

        return {
            x: (clientX - rect.left) / canvasScale,
            y: (clientY - rect.top) / canvasScale,
        };
    };
    
    const handleUploadedImageDrop = (
    event: React.DragEvent<HTMLDivElement>,
) => {
    const uploadedImageId = event.dataTransfer.getData(
        'application/modden-upload-image',
    );

    const stockImageData = event.dataTransfer.getData(
        'application/modden-stock-image',
    );

    if (!uploadedImageId && !stockImageData) {
        return;
    }

    event.preventDefault();

    const dropPoint = getCanvasPoint(event.clientX, event.clientY);

    if (!dropPoint) {
        return;
    }

    if (stockImageData) {
        try {
            const stockImage = JSON.parse(stockImageData) as EditorUploadedImage;

            void onUploadedImagePlace(stockImage, dropPoint);
        } catch (err) {
            console.error(err);
        }

        return;
    }

    const uploadedImage = uploadedImages.find(
        (image) => image.id === uploadedImageId,
    );

    if (!uploadedImage) {
        return;
    }

    void onUploadedImagePlace(uploadedImage, dropPoint);
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
                    onDragOver={(event) => {
    if (
        event.dataTransfer.types.includes(
            'application/modden-upload-image',
        ) ||
        event.dataTransfer.types.includes(
            'application/modden-stock-image',
        )
    ) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }
}}
                    onDrop={handleUploadedImageDrop}
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
