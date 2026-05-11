// src/features/editor/ui/panels/tools-panel/drawing/EditorCanvasDrawing.tsx
import { useMemo, useState } from 'react';
import type {
    EditorDrawObject,
    EditorDrawingTool,
    EditorOption,
    EditorScene,
    EditorSceneObject,
} from '../../../../model/editorTypes';

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

const ERASER_HIT_SCALE = 0.55;
const MIN_ERASE_DISTANCE = 2;

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

function getDistanceToSegment(
    point: EditorDrawObject['points'][number],
    segmentStart: EditorDrawObject['points'][number],
    segmentEnd: EditorDrawObject['points'][number],
) {
    const dx = segmentEnd.x - segmentStart.x;
    const dy = segmentEnd.y - segmentStart.y;

    if (dx === 0 && dy === 0) {
        return Math.hypot(point.x - segmentStart.x, point.y - segmentStart.y);
    }

    const t = Math.max(
        0,
        Math.min(
            1,
            ((point.x - segmentStart.x) * dx +
                (point.y - segmentStart.y) * dy) /
                (dx * dx + dy * dy),
        ),
    );

    const closestPoint = {
        x: segmentStart.x + t * dx,
        y: segmentStart.y + t * dy,
    };

    return Math.hypot(point.x - closestPoint.x, point.y - closestPoint.y);
}

function isPointNearPolyline(
    point: EditorDrawObject['points'][number],
    polyline: EditorDrawObject['points'],
    distance: number,
) {
    if (polyline.length < 2) {
        return false;
    }

    for (let index = 0; index < polyline.length - 1; index += 1) {
        const currentDistance = getDistanceToSegment(
            point,
            polyline[index],
            polyline[index + 1],
        );

        if (currentDistance <= distance) {
            return true;
        }
    }

    return false;
}

function splitDrawObjectByEraser(
    object: EditorDrawObject,
    eraserObject: EditorDrawObject,
): EditorDrawObject[] {
    const eraseDistance = Math.max(
        MIN_ERASE_DISTANCE,
        eraserObject.strokeWidth * ERASER_HIT_SCALE,
    );

    const segments: EditorDrawObject[] = [];
    let currentPoints: EditorDrawObject['points'] = [];

    object.points.forEach((point) => {
        const shouldErasePoint = isPointNearPolyline(
            point,
            eraserObject.points,
            eraseDistance,
        );

        if (shouldErasePoint) {
            if (currentPoints.length > 1) {
                segments.push({
                    ...object,
                    id: createDrawObjectId(),
                    points: currentPoints,
                });
            }

            currentPoints = [];
            return;
        }

        currentPoints.push(point);
    });

    if (currentPoints.length > 1) {
        segments.push({
            ...object,
            id: createDrawObjectId(),
            points: currentPoints,
        });
    }

    return segments;
}

function eraseSceneObjects(
    scene: EditorScene,
    eraserObject: EditorDrawObject,
): EditorScene {
    return {
        ...scene,
        objects: scene.objects.flatMap((object) => {
            if (object.type !== 'draw') {
                return [object];
            }

            if (object.tool === 'eraser') {
                return [object];
            }

            if (object.locked) {
                return [object];
            }

            return splitDrawObjectByEraser(object, eraserObject);
        }),
    };
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

            if (draftDrawObject.tool === 'eraser') {
                onSceneCommit(eraseSceneObjects(latestScene, draftDrawObject));
            } else {
                onSceneCommit({
                    ...latestScene,
                    objects: [...latestScene.objects, draftDrawObject],
                });
            }
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
    selectedObjectId: string | null;
};

export function DrawingLayer({
    objects,
    selectedObjectId,
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
                            maskUnits="userSpaceOnUse"
                            maskContentUnits="userSpaceOnUse"
                            x={0}
                            y={0}
                            width={canvasWidth}
                            height={canvasHeight}
                        >
                            <rect
                                x={0}
                                y={0}
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
                const isSelected = object.id === selectedObjectId;

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
                            {isSelected && (
                                <path
                                    d={path}
                                    fill="none"
                                    stroke="#4A90E2"
                                    strokeWidth={object.strokeWidth + 8}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity="0.25"
                                />
                            )}

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
                    <g key={object.id} {...maskProps}>
                        {isSelected && (
                            <path
                                d={path}
                                fill="none"
                                stroke="#4A90E2"
                                strokeWidth={object.strokeWidth + 8}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity="0.25"
                            />
                        )}

                        <path
                            d={path}
                            fill="none"
                            stroke={object.color}
                            strokeWidth={object.strokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={object.opacity}
                        />
                    </g>
                );
            })}
        </svg>
    );
}
