// src/features/editor/ui/panels/tools-panel/canvasDrawing.ts
import { useEffect, useMemo, useRef } from 'react';
import { PencilBrush } from 'fabric';
import type { Canvas, FabricObject, Path } from 'fabric';
import type {
    EditorDrawObject,
    EditorDrawingTool,
    EditorDrawPathCommand,
    EditorOption,
    EditorScene,
} from '../../../model/editorTypes';

const DRAWING_TOOLS: EditorDrawingTool[] = [
    'pencil',
    'marker',
    'highliter',
    'eraser',
];

const BRUSH_TOOLS: EditorDrawingTool[] = ['pencil', 'marker', 'highliter'];

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
        strokeWidth: 1,
        opacity: 1,
        fallbackColor: '#000000',
    },
};

type CanvasPoint = {
    x: number;
    y: number;
};

function createDrawObjectId() {
    return `draw_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isDrawingTool(value: string): value is EditorDrawingTool {
    return DRAWING_TOOLS.includes(value as EditorDrawingTool);
}

function isBrushTool(
    tool: EditorDrawingTool | null,
): tool is EditorDrawingTool {
    return Boolean(tool && BRUSH_TOOLS.includes(tool));
}

export function getActiveDrawingTool(activeOption: EditorOption) {
    if (activeOption?.panel === 'tools' && isDrawingTool(activeOption.id)) {
        return activeOption.id;
    }

    return null;
}

function getDistance(firstPoint: CanvasPoint, secondPoint: CanvasPoint) {
    const dx = firstPoint.x - secondPoint.x;
    const dy = firstPoint.y - secondPoint.y;

    return Math.sqrt(dx * dx + dy * dy);
}

function getDistanceToSegment(
    point: CanvasPoint,
    segmentStart: CanvasPoint,
    segmentEnd: CanvasPoint,
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

function hexToRgba(hex: string, opacity: number) {
    const normalizedHex = hex.replace('#', '');

    if (normalizedHex.length !== 6) {
        return hex;
    }

    const r = parseInt(normalizedHex.slice(0, 2), 16);
    const g = parseInt(normalizedHex.slice(2, 4), 16);
    const b = parseInt(normalizedHex.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getCanvasPoint(
    event: React.PointerEvent<HTMLDivElement>,
    canvasRef: React.RefObject<HTMLDivElement | null>,
    canvasScale: number,
) {
    const canvas = canvasRef.current;

    if (!canvas) {
        return null;
    }

    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) / canvasScale,
        y: (event.clientY - rect.top) / canvasScale,
    };
}

function getPathBounds(path: EditorDrawPathCommand[]) {
    const xValues: number[] = [];
    const yValues: number[] = [];

    path.forEach((command) => {
        for (let index = 1; index < command.length; index += 2) {
            const x = command[index];
            const y = command[index + 1];

            if (typeof x === 'number' && typeof y === 'number') {
                xValues.push(x);
                yValues.push(y);
            }
        }
    });

    return {
        minX: Math.min(...xValues),
        minY: Math.min(...yValues),
    };
}

function normalizePathForScene(path: EditorDrawPathCommand[]) {
    const { minX, minY } = getPathBounds(path);

    const normalizedPath = path.map((command) =>
        command.map((value, index) => {
            if (index === 0 || typeof value !== 'number') {
                return value;
            }

            return index % 2 === 1 ? value - minX : value - minY;
        }),
    ) as EditorDrawPathCommand[];

    return {
        path: normalizedPath,
        x: minX,
        y: minY,
    };
}

function getPointsBounds(points: CanvasPoint[]) {
    const xValues = points.map((point) => point.x);
    const yValues = points.map((point) => point.y);

    return {
        minX: Math.min(...xValues),
        minY: Math.min(...yValues),
        maxX: Math.max(...xValues),
        maxY: Math.max(...yValues),
    };
}

function rotatePoint(point: CanvasPoint, angle: number) {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    return {
        x: point.x * cos - point.y * sin,
        y: point.x * sin + point.y * cos,
    };
}

function transformLocalPointToCanvas(
    point: CanvasPoint,
    object: EditorDrawObject,
    bounds: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    },
) {
    const scaleX = object.scaleX ?? 1;
    const scaleY = object.scaleY ?? 1;
    const rotation = object.rotation ?? 0;

    const baseWidth = Math.max(1, bounds.maxX - bounds.minX);
    const baseHeight = Math.max(1, bounds.maxY - bounds.minY);

    const objectX = object.x ?? bounds.minX;
    const objectY = object.y ?? bounds.minY;

    const centerX = objectX + (baseWidth * scaleX) / 2;
    const centerY = objectY + (baseHeight * scaleY) / 2;

    const localX = point.x - bounds.minX;
    const localY = point.y - bounds.minY;

    const scaledPoint = {
        x: (localX - baseWidth / 2) * scaleX,
        y: (localY - baseHeight / 2) * scaleY,
    };

    const rotatedPoint = rotatePoint(scaledPoint, rotation);

    return {
        x: centerX + rotatedPoint.x,
        y: centerY + rotatedPoint.y,
    };
}

function sampleLine(from: CanvasPoint, to: CanvasPoint, points: CanvasPoint[]) {
    const distance = getDistance(from, to);
    const steps = Math.max(1, Math.ceil(distance / 6));

    for (let step = 1; step <= steps; step += 1) {
        const t = step / steps;

        points.push({
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
        });
    }
}

function sampleQuadraticCurve(
    from: CanvasPoint,
    control: CanvasPoint,
    to: CanvasPoint,
    points: CanvasPoint[],
) {
    const distance = getDistance(from, control) + getDistance(control, to);
    const steps = Math.max(8, Math.ceil(distance / 6));

    for (let step = 1; step <= steps; step += 1) {
        const t = step / steps;
        const oneMinusT = 1 - t;

        points.push({
            x:
                oneMinusT * oneMinusT * from.x +
                2 * oneMinusT * t * control.x +
                t * t * to.x,
            y:
                oneMinusT * oneMinusT * from.y +
                2 * oneMinusT * t * control.y +
                t * t * to.y,
        });
    }
}

function sampleCubicCurve(
    from: CanvasPoint,
    firstControl: CanvasPoint,
    secondControl: CanvasPoint,
    to: CanvasPoint,
    points: CanvasPoint[],
) {
    const distance =
        getDistance(from, firstControl) +
        getDistance(firstControl, secondControl) +
        getDistance(secondControl, to);

    const steps = Math.max(10, Math.ceil(distance / 6));

    for (let step = 1; step <= steps; step += 1) {
        const t = step / steps;
        const oneMinusT = 1 - t;

        points.push({
            x:
                oneMinusT * oneMinusT * oneMinusT * from.x +
                3 * oneMinusT * oneMinusT * t * firstControl.x +
                3 * oneMinusT * t * t * secondControl.x +
                t * t * t * to.x,
            y:
                oneMinusT * oneMinusT * oneMinusT * from.y +
                3 * oneMinusT * oneMinusT * t * firstControl.y +
                3 * oneMinusT * t * t * secondControl.y +
                t * t * t * to.y,
        });
    }
}

function samplePathToPoints(path: EditorDrawPathCommand[]) {
    const points: CanvasPoint[] = [];
    let currentPoint: CanvasPoint | null = null;

    path.forEach((command) => {
        const commandType = command[0];

        if (commandType === 'M') {
            const x = command[1];
            const y = command[2];

            if (typeof x === 'number' && typeof y === 'number') {
                currentPoint = { x, y };
                points.push(currentPoint);
            }

            return;
        }

        if (commandType === 'L' && currentPoint) {
            const x = command[1];
            const y = command[2];

            if (typeof x === 'number' && typeof y === 'number') {
                const nextPoint = { x, y };
                sampleLine(currentPoint, nextPoint, points);
                currentPoint = nextPoint;
            }

            return;
        }

        if (commandType === 'Q' && currentPoint) {
            const controlX = command[1];
            const controlY = command[2];
            const x = command[3];
            const y = command[4];

            if (
                typeof controlX === 'number' &&
                typeof controlY === 'number' &&
                typeof x === 'number' &&
                typeof y === 'number'
            ) {
                const controlPoint = { x: controlX, y: controlY };
                const nextPoint = { x, y };

                sampleQuadraticCurve(
                    currentPoint,
                    controlPoint,
                    nextPoint,
                    points,
                );

                currentPoint = nextPoint;
            }

            return;
        }

        if (commandType === 'C' && currentPoint) {
            const firstControlX = command[1];
            const firstControlY = command[2];
            const secondControlX = command[3];
            const secondControlY = command[4];
            const x = command[5];
            const y = command[6];

            if (
                typeof firstControlX === 'number' &&
                typeof firstControlY === 'number' &&
                typeof secondControlX === 'number' &&
                typeof secondControlY === 'number' &&
                typeof x === 'number' &&
                typeof y === 'number'
            ) {
                const firstControl = {
                    x: firstControlX,
                    y: firstControlY,
                };
                const secondControl = {
                    x: secondControlX,
                    y: secondControlY,
                };
                const nextPoint = { x, y };

                sampleCubicCurve(
                    currentPoint,
                    firstControl,
                    secondControl,
                    nextPoint,
                    points,
                );

                currentPoint = nextPoint;
            }
        }
    });

    return points;
}

function getAbsoluteDrawPoints(object: EditorDrawObject) {
    const sourcePoints = samplePathToPoints(object.path);

    if (sourcePoints.length === 0) {
        return [];
    }

    const bounds = getPointsBounds(sourcePoints);

    return sourcePoints.map((point) =>
        transformLocalPointToCanvas(point, object, bounds),
    );
}

function doesEraserTouchDrawObject(
    object: EditorDrawObject,
    eraserPoint: CanvasPoint,
    eraserStrokeWidth: number,
) {
    const points = getAbsoluteDrawPoints(object);

    if (points.length === 0) {
        return false;
    }

    const objectScale = Math.max(object.scaleX ?? 1, object.scaleY ?? 1);

    const hitDistance = Math.max(
        8,
        eraserStrokeWidth / 2 + (object.strokeWidth * objectScale) / 2,
    );

    if (points.length === 1) {
        return getDistance(points[0], eraserPoint) <= hitDistance;
    }

    for (let index = 0; index < points.length - 1; index += 1) {
        const distance = getDistanceToSegment(
            eraserPoint,
            points[index],
            points[index + 1],
        );

        if (distance <= hitDistance) {
            return true;
        }
    }

    return false;
}

function eraseTouchedDrawObjects(
    scene: EditorScene,
    eraserPoint: CanvasPoint,
    eraserStrokeWidth: number,
) {
    let hasDeleted = false;

    const nextObjects = scene.objects.filter((object) => {
        if (object.type !== 'draw') {
            return true;
        }

        if (object.locked) {
            return true;
        }

        if (doesEraserTouchDrawObject(object, eraserPoint, eraserStrokeWidth)) {
            hasDeleted = true;
            return false;
        }

        return true;
    });

    return {
        scene: {
            ...scene,
            objects: nextObjects,
        },
        hasDeleted,
    };
}

type UseCanvasDrawingParams = {
    scene: EditorScene;
    activeOption: EditorOption;
    toolColors: Record<string, string>;
    toolStrokeWidths: Record<string, number>;
    canvasScale: number;
    canvasRef: React.RefObject<HTMLDivElement | null>;
    canvasInstanceRef: React.MutableRefObject<Canvas | null>;
    getLatestScene: () => EditorScene;
    onSceneCommit: (scene: EditorScene) => void;
};

export function useCanvasDrawing({
    scene,
    activeOption,
    toolColors,
    toolStrokeWidths,
    canvasScale,
    canvasRef,
    canvasInstanceRef,
    onSceneCommit,
}: UseCanvasDrawingParams) {
    const latestSceneRef = useRef(scene);
    const eraserPointerIdRef = useRef<number | null>(null);

    const activeDrawingTool = useMemo(
        () => getActiveDrawingTool(activeOption),
        [activeOption],
    );

    useEffect(() => {
        latestSceneRef.current = scene;
    }, [scene]);

    useEffect(() => {
        const canvas = canvasInstanceRef.current;

        if (!canvas) {
            return;
        }

        if (!isBrushTool(activeDrawingTool)) {
            canvas.isDrawingMode = false;
            canvas.freeDrawingBrush = undefined;
            return;
        }

        const settings = TOOL_SETTINGS[activeDrawingTool];
        const color = toolColors[activeDrawingTool] ?? settings.fallbackColor;
        const strokeWidth =
            toolStrokeWidths[activeDrawingTool] ?? settings.strokeWidth;

        const brush = new PencilBrush(canvas);

        brush.color = hexToRgba(color, settings.opacity);
        brush.width = strokeWidth;

        canvas.freeDrawingBrush = brush;
        canvas.isDrawingMode = true;

        const handlePathCreated = (event: { path?: FabricObject }) => {
            const fabricPath = event.path as Path | undefined;

            if (!fabricPath || !fabricPath.path) {
                return;
            }

            canvas.remove(fabricPath);

            const normalizedPath = normalizePathForScene(
                fabricPath.path as EditorDrawPathCommand[],
            );

            const nextDrawObject: EditorDrawObject = {
                id: createDrawObjectId(),
                type: 'draw',
                tool: activeDrawingTool,
                path: normalizedPath.path,
                color,
                strokeWidth,
                opacity: settings.opacity,
                x: normalizedPath.x,
                y: normalizedPath.y,
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
            };

            const latestScene = latestSceneRef.current;

            onSceneCommit({
                ...latestScene,
                objects: [...latestScene.objects, nextDrawObject],
            });
        };

        canvas.on('path:created', handlePathCreated);

        return () => {
            canvas.off('path:created', handlePathCreated);
            canvas.isDrawingMode = false;
        };
    }, [
        activeDrawingTool,
        canvasInstanceRef,
        onSceneCommit,
        toolColors,
        toolStrokeWidths,
    ]);

    const eraseAtPoint = (point: CanvasPoint) => {
        const eraserStrokeWidth =
            toolStrokeWidths.eraser ?? TOOL_SETTINGS.eraser.strokeWidth;

        const result = eraseTouchedDrawObjects(
            latestSceneRef.current,
            point,
            eraserStrokeWidth,
        );

        if (!result.hasDeleted) {
            return;
        }

        latestSceneRef.current = result.scene;
        onSceneCommit(result.scene);
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (activeDrawingTool !== 'eraser') {
            return;
        }

        const point = getCanvasPoint(event, canvasRef, canvasScale);

        if (!point) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        eraserPointerIdRef.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);

        eraseAtPoint(point);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (activeDrawingTool !== 'eraser') {
            return;
        }

        if (eraserPointerIdRef.current !== event.pointerId) {
            return;
        }

        const point = getCanvasPoint(event, canvasRef, canvasScale);

        if (!point) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        eraseAtPoint(point);
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (activeDrawingTool !== 'eraser') {
            return;
        }

        if (eraserPointerIdRef.current !== event.pointerId) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        eraserPointerIdRef.current = null;
    };

    return {
        activeDrawingTool,
        visibleObjects: scene.objects,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
    };
}
