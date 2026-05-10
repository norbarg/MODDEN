// src/features/editor/ui/canvas/drawing/EditorCanvasDrawing.tsx
import { useMemo, useState } from 'react';
import type {
    EditorDrawObject,
    EditorDrawingTool,
    EditorOption,
    EditorScene,
    EditorSceneObject,
} from '../../../model/editorTypes';

const DRAWING_TOOLS: EditorDrawingTool[] = [
    'pencil',
    'marker',
    'highliter',
    'eraser',
];

const TOOL_SETTINGS: Record<
    EditorDrawingTool,
    {
        strokeWidth: number;
        opacity: number;
        fallbackColor: string;
    }
> = {
    pencil: {
        strokeWidth: 5,
        opacity: 1,
        fallbackColor: '#98BA61',
    },
    marker: {
        strokeWidth: 12,
        opacity: 1,
        fallbackColor: '#F8A1C4',
    },
    highliter: {
        strokeWidth: 22,
        opacity: 0.35,
        fallbackColor: '#48D8FE',
    },
    eraser: {
        strokeWidth: 28,
        opacity: 1,
        fallbackColor: '#000000',
    },
};

const MIN_POINT_DISTANCE = 3;

function getDistance(
    firstPoint: EditorDrawObject['points'][number],
    secondPoint: EditorDrawObject['points'][number],
) {
    const dx = firstPoint.x - secondPoint.x;
    const dy = firstPoint.y - secondPoint.y;

    return Math.sqrt(dx * dx + dy * dy);
}

function shouldAddPoint(
    points: EditorDrawObject['points'],
    nextPoint: EditorDrawObject['points'][number],
) {
    const lastPoint = points.at(-1);

    if (!lastPoint) {
        return true;
    }

    return getDistance(lastPoint, nextPoint) >= MIN_POINT_DISTANCE;
}

function createDrawObjectId() {
    return `draw_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isDrawingTool(value: string): value is EditorDrawingTool {
    return DRAWING_TOOLS.includes(value as EditorDrawingTool);
}

function pointsToPath(points: EditorDrawObject['points']) {
    if (points.length === 0) {
        return '';
    }

    const [firstPoint, ...restPoints] = points;

    return [
        `M ${firstPoint.x} ${firstPoint.y}`,
        ...restPoints.map((point) => `L ${point.x} ${point.y}`),
    ].join(' ');
}

type UseCanvasDrawingParams = {
    scene: EditorScene;
    activeOption: EditorOption;
    toolColors: Record<string, string>;
    canvasScale: number;
    canvasRef: React.RefObject<HTMLDivElement | null>;
    getLatestScene: () => EditorScene;
    onSceneCommit: (scene: EditorScene) => void;
    toolStrokeWidths: Record<string, number>;
};

export function useCanvasDrawing({
    scene,
    activeOption,
    toolColors,
    canvasScale,
    canvasRef,
    getLatestScene,
    onSceneCommit,
    toolStrokeWidths,
}: UseCanvasDrawingParams) {
    const [draftDrawObject, setDraftDrawObject] =
        useState<EditorDrawObject | null>(null);

    const activeDrawingTool = useMemo(() => {
        if (activeOption?.panel === 'tools' && isDrawingTool(activeOption.id)) {
            return activeOption.id;
        }

        return null;
    }, [activeOption]);

    const visibleObjects = draftDrawObject
        ? [...scene.objects, draftDrawObject]
        : scene.objects;

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

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!activeDrawingTool) {
            return;
        }

        const point = getCanvasPoint(event);

        if (!point) {
            return;
        }

        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);

        const settings = TOOL_SETTINGS[activeDrawingTool];

        const newDrawObject: EditorDrawObject = {
            id: createDrawObjectId(),
            type: 'draw',
            tool: activeDrawingTool,
            points: [point],
            color:
                activeDrawingTool === 'eraser'
                    ? '#000000'
                    : (toolColors[activeDrawingTool] ?? settings.fallbackColor),
            strokeWidth:
                toolStrokeWidths[activeDrawingTool] ?? settings.strokeWidth,
            opacity: settings.opacity,
        };

        setDraftDrawObject(newDrawObject);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!activeDrawingTool || !draftDrawObject) {
            return;
        }

        const point = getCanvasPoint(event);

        if (!point) {
            return;
        }

        event.preventDefault();

        setDraftDrawObject((currentObject) => {
            if (!currentObject) {
                return currentObject;
            }

            if (!shouldAddPoint(currentObject.points, point)) {
                return currentObject;
            }

            return {
                ...currentObject,
                points: [...currentObject.points, point],
            };
        });
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!draftDrawObject) {
            return;
        }

        event.preventDefault();

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        if (draftDrawObject.points.length > 1) {
            const latestScene = getLatestScene();

            onSceneCommit({
                ...latestScene,
                objects: [...latestScene.objects, draftDrawObject],
            });
        }

        setDraftDrawObject(null);
    };

    return {
        activeDrawingTool,
        visibleObjects,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
    };
}

type DrawingLayerProps = {
    objects: EditorSceneObject[];
    canvasWidth: number;
    canvasHeight: number;
};

export function DrawingLayer({
    objects,
    canvasWidth,
    canvasHeight,
}: DrawingLayerProps) {
    return (
        <svg
            className="editor-canvas__drawing-layer"
            width={canvasWidth}
            height={canvasHeight}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        >
            <defs>
                <filter
                    id="moddenPencilTexture"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                    filterUnits="objectBoundingBox"
                >
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="2"
                        numOctaves="5"
                        stitchTiles="stitch"
                        result="noise"
                    />
                    <feColorMatrix
                        type="matrix"
                        values="
                            0 0 0 0 0
                            0 0 0 0 0
                            0 0 0 0 0
                            0 0 0 -1.5 1.5
                        "
                        result="textureAlpha"
                    />
                    <feComposite
                        operator="in"
                        in="SourceGraphic"
                        in2="textureAlpha"
                        result="texturedStroke"
                    />
                </filter>

                {objects.map((object, objectIndex) => {
                    if (object.type !== 'draw' || object.tool === 'eraser') {
                        return null;
                    }

                    const futureErasers = objects
                        .slice(objectIndex + 1)
                        .filter(
                            (futureObject) =>
                                futureObject.type === 'draw' &&
                                futureObject.tool === 'eraser',
                        );

                    if (futureErasers.length === 0) {
                        return null;
                    }

                    return (
                        <mask
                            key={`mask-${object.id}`}
                            id={`erase-mask-${object.id}`}
                        >
                            <rect
                                x="0"
                                y="0"
                                width={canvasWidth}
                                height={canvasHeight}
                                fill="white"
                            />

                            {futureErasers.map((eraserObject) => {
                                if (
                                    eraserObject.type !== 'draw' ||
                                    eraserObject.tool !== 'eraser'
                                ) {
                                    return null;
                                }

                                return (
                                    <path
                                        key={eraserObject.id}
                                        d={pointsToPath(eraserObject.points)}
                                        fill="none"
                                        stroke="black"
                                        strokeWidth={eraserObject.strokeWidth}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                );
                            })}
                        </mask>
                    );
                })}
            </defs>

            {objects.map((object, objectIndex) => {
                if (object.type !== 'draw' || object.tool === 'eraser') {
                    return null;
                }

                const path = pointsToPath(object.points);

                const hasFutureErasers = objects
                    .slice(objectIndex + 1)
                    .some(
                        (futureObject) =>
                            futureObject.type === 'draw' &&
                            futureObject.tool === 'eraser',
                    );

                const maskProps = hasFutureErasers
                    ? {
                          mask: `url(#erase-mask-${object.id})`,
                      }
                    : {};

                if (object.tool === 'pencil') {
                    return (
                        <g key={object.id} {...maskProps}>
                            <path
                                d={path}
                                fill="none"
                                stroke={object.color}
                                strokeWidth={object.strokeWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity="0.35"
                            />

                            <path
                                d={path}
                                fill="none"
                                stroke={object.color}
                                strokeWidth={object.strokeWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity="0.95"
                                filter="url(#moddenPencilTexture)"
                            />

                            <path
                                d={path}
                                fill="none"
                                stroke={object.color}
                                strokeWidth={object.strokeWidth * 0.45}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity="0.55"
                                strokeDasharray="1 4"
                            />
                        </g>
                    );
                }

                return (
                    <path
                        key={object.id}
                        d={path}
                        fill="none"
                        stroke={object.color}
                        strokeWidth={object.strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={object.opacity}
                        {...maskProps}
                    />
                );
            })}
        </svg>
    );
}
