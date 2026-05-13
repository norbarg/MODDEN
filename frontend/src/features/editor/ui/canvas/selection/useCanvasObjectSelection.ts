// src/features/editor/ui/canvas/selection/useCanvasObjectSelection.ts
import { useRef, useState } from 'react';
import type {
    EditorDrawObject,
    EditorScene,
    EditorSceneObject,
    EditorShapeObject,
} from '../../../model/editorTypes';

type CanvasPoint = {
    x: number;
    y: number;
};

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

type InteractionMode =
    | {
          type: 'move';
      }
    | {
          type: 'resize';
          handle: ResizeHandle;
      }
    | {
          type: 'rotate';
          startAngle: number;
          startRotation: number;
      };

type UseCanvasObjectSelectionParams = {
    scene: EditorScene;
    canvasScale: number;
    canvasRef: React.RefObject<HTMLDivElement | null>;
    selectedObjectId: string | null;
    getLatestScene: () => EditorScene;
    onObjectSelect: (objectId: string | null) => void;
    onSceneCommit: (scene: EditorScene) => void;
};

const HIT_TEST_PADDING = 8;
const ROTATE_HANDLE_OFFSET = 32;
const MIN_SHAPE_SIZE = 24;

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

function isPointOnDrawObject(point: CanvasPoint, object: EditorDrawObject) {
    if (object.points.length < 2) {
        return false;
    }

    const hitDistance = object.strokeWidth / 2 + HIT_TEST_PADDING;

    for (let index = 0; index < object.points.length - 1; index += 1) {
        const distance = getDistanceToSegment(
            point,
            object.points[index],
            object.points[index + 1],
        );

        if (distance <= hitDistance) {
            return true;
        }
    }

    return false;
}

function getShapeCenter(object: EditorShapeObject): CanvasPoint {
    return {
        x: object.x + object.width / 2,
        y: object.y + object.height / 2,
    };
}

function rotatePointAroundCenter(
    point: CanvasPoint,
    center: CanvasPoint,
    rotation: number,
): CanvasPoint {
    const radians = (rotation * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos,
    };
}

function getLocalPoint(point: CanvasPoint, object: EditorShapeObject) {
    const center = getShapeCenter(object);
    const unrotatedPoint = rotatePointAroundCenter(
        point,
        center,
        -object.rotation,
    );

    return {
        x: unrotatedPoint.x - object.x,
        y: unrotatedPoint.y - object.y,
    };
}

function isPointInsidePolygon(point: CanvasPoint, polygon: CanvasPoint[]) {
    let isInside = false;

    for (
        let firstIndex = 0, secondIndex = polygon.length - 1;
        firstIndex < polygon.length;
        secondIndex = firstIndex, firstIndex += 1
    ) {
        const firstPoint = polygon[firstIndex];
        const secondPoint = polygon[secondIndex];

        const intersects =
            firstPoint.y > point.y !== secondPoint.y > point.y &&
            point.x <
                ((secondPoint.x - firstPoint.x) * (point.y - firstPoint.y)) /
                    (secondPoint.y - firstPoint.y) +
                    firstPoint.x;

        if (intersects) {
            isInside = !isInside;
        }
    }

    return isInside;
}

function getPentagonPoints(width: number, height: number): CanvasPoint[] {
    return [
        { x: width / 2, y: 0 },
        { x: width, y: height * 0.36 },
        { x: width * 0.82, y: height },
        { x: width * 0.18, y: height },
        { x: 0, y: height * 0.36 },
    ];
}

function isPointOnShapeObject(point: CanvasPoint, object: EditorShapeObject) {
    const localPoint = getLocalPoint(point, object);
    const { x, y } = localPoint;
    const { width, height } = object;

    if (object.shapeType === 'circle') {
        const radiusX = width / 2;
        const radiusY = height / 2;
        const centerX = width / 2;
        const centerY = height / 2;

        return (
            ((x - centerX) * (x - centerX)) / (radiusX * radiusX) +
                ((y - centerY) * (y - centerY)) / (radiusY * radiusY) <=
            1
        );
    }

    if (object.shapeType === 'triangle') {
        return isPointInsidePolygon(localPoint, [
            { x: width / 2, y: 0 },
            { x: width, y: height },
            { x: 0, y: height },
        ]);
    }

    if (object.shapeType === 'diamond') {
        return isPointInsidePolygon(localPoint, [
            { x: width / 2, y: 0 },
            { x: width, y: height / 2 },
            { x: width / 2, y: height },
            { x: 0, y: height / 2 },
        ]);
    }

    if (object.shapeType === 'pentagon') {
        return isPointInsidePolygon(localPoint, getPentagonPoints(width, height));
    }

    return x >= 0 && x <= width && y >= 0 && y <= height;
}

function getShapeResizeHandles(object: EditorShapeObject) {
    const center = getShapeCenter(object);

    const localHandles: Record<ResizeHandle, CanvasPoint> = {
        nw: { x: object.x, y: object.y },
        ne: { x: object.x + object.width, y: object.y },
        sw: { x: object.x, y: object.y + object.height },
        se: { x: object.x + object.width, y: object.y + object.height },
    };

    return Object.entries(localHandles).map(([handle, point]) => ({
        handle: handle as ResizeHandle,
        point: rotatePointAroundCenter(point, center, object.rotation),
    }));
}

function getShapeRotateHandle(object: EditorShapeObject) {
    const center = getShapeCenter(object);

    return rotatePointAroundCenter(
        {
            x: center.x,
            y: object.y - ROTATE_HANDLE_OFFSET,
        },
        center,
        object.rotation,
    );
}

function findShapeControlAtPoint(
    point: CanvasPoint,
    object: EditorShapeObject,
): InteractionMode | null {
    const rotateHandle = getShapeRotateHandle(object);

    if (Math.hypot(point.x - rotateHandle.x, point.y - rotateHandle.y) <= 12) {
        const center = getShapeCenter(object);

        return {
            type: 'rotate',
            startAngle: Math.atan2(point.y - center.y, point.x - center.x),
            startRotation: object.rotation,
        };
    }

    const resizeHandle = getShapeResizeHandles(object).find(({ point: item }) => {
        return Math.hypot(point.x - item.x, point.y - item.y) <= 12;
    });

    if (resizeHandle) {
        return {
            type: 'resize',
            handle: resizeHandle.handle,
        };
    }

    return null;
}

function findObjectAtPoint(objects: EditorSceneObject[], point: CanvasPoint) {
    for (let index = objects.length - 1; index >= 0; index -= 1) {
        const object = objects[index];

        if (object.type === 'shape') {
            if (isPointOnShapeObject(point, object)) {
                return object;
            }
        }

        if (object.type === 'draw' && object.tool !== 'eraser') {
            if (isPointOnDrawObject(point, object)) {
                return object;
            }
        }
    }

    return null;
}

function moveObject(object: EditorSceneObject, dx: number, dy: number) {
    if (object.type === 'shape') {
        return {
            ...object,
            x: object.x + dx,
            y: object.y + dy,
        };
    }

    if (object.type === 'draw') {
        return {
            ...object,
            points: object.points.map((point) => ({
                x: point.x + dx,
                y: point.y + dy,
            })),
        };
    }

    return object;
}

function resizeShapeObject(
    object: EditorShapeObject,
    pointerPoint: CanvasPoint,
    handle: ResizeHandle,
): EditorShapeObject {
    const center = getShapeCenter(object);
    const unrotatedPoint = rotatePointAroundCenter(
        pointerPoint,
        center,
        -object.rotation,
    );

    const localX = unrotatedPoint.x - center.x;
    const localY = unrotatedPoint.y - center.y;

    const width =
        handle === 'nw' || handle === 'sw'
            ? Math.abs(localX) * 2
            : Math.abs(localX) * 2;

    const height =
        handle === 'nw' || handle === 'ne'
            ? Math.abs(localY) * 2
            : Math.abs(localY) * 2;

    const nextWidth = Math.max(MIN_SHAPE_SIZE, width);
    const nextHeight = Math.max(MIN_SHAPE_SIZE, height);

    return {
        ...object,
        width: nextWidth,
        height: nextHeight,
        x: center.x - nextWidth / 2,
        y: center.y - nextHeight / 2,
    };
}

function rotateShapeObject(
    object: EditorShapeObject,
    pointerPoint: CanvasPoint,
    interaction: Extract<InteractionMode, { type: 'rotate' }>,
): EditorShapeObject {
    const center = getShapeCenter(object);
    const currentAngle = Math.atan2(
        pointerPoint.y - center.y,
        pointerPoint.x - center.x,
    );

    const angleDiff = ((currentAngle - interaction.startAngle) * 180) / Math.PI;

    return {
        ...object,
        rotation: interaction.startRotation + angleDiff,
    };
}

export function useCanvasObjectSelection({
    scene,
    canvasScale,
    canvasRef,
    selectedObjectId,
    getLatestScene,
    onObjectSelect,
    onSceneCommit,
}: UseCanvasObjectSelectionParams) {
    const [previewScene, setPreviewScene] = useState<EditorScene | null>(null);

    const dragStartPointRef = useRef<CanvasPoint | null>(null);
    const dragOriginalSceneRef = useRef<EditorScene | null>(null);
    const interactionModeRef = useRef<InteractionMode | null>(null);
    const activeObjectIdRef = useRef<string | null>(null);
    const isDraggingRef = useRef(false);

    const visibleScene = previewScene ?? scene;

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

    const handleSelectionPointerDown = (
        event: React.PointerEvent<HTMLDivElement>,
    ) => {
        const point = getCanvasPoint(event);

        if (!point) {
            return false;
        }

        const latestScene = getLatestScene();
        const selectedObject =
            latestScene.objects.find(
                (object) => object.id === selectedObjectId,
            ) ?? null;

        if (selectedObject?.type === 'shape' && !selectedObject.locked) {
            const control = findShapeControlAtPoint(point, selectedObject);

            if (control) {
                event.preventDefault();
                event.stopPropagation();

                event.currentTarget.setPointerCapture(event.pointerId);

                dragStartPointRef.current = point;
                dragOriginalSceneRef.current = latestScene;
                interactionModeRef.current = control;
                activeObjectIdRef.current = selectedObject.id;
                isDraggingRef.current = true;

                return true;
            }
        }

        const clickedObject = findObjectAtPoint(latestScene.objects, point);

        if (!clickedObject) {
            onObjectSelect(null);
            return false;
        }

        event.preventDefault();
        event.stopPropagation();

        onObjectSelect(clickedObject.id);

        if (clickedObject.locked) {
            return true;
        }

        event.currentTarget.setPointerCapture(event.pointerId);

        dragStartPointRef.current = point;
        dragOriginalSceneRef.current = latestScene;
        interactionModeRef.current = { type: 'move' };
        activeObjectIdRef.current = clickedObject.id;
        isDraggingRef.current = true;

        return true;
    };

    const handleSelectionPointerMove = (
        event: React.PointerEvent<HTMLDivElement>,
    ) => {
        if (
            !isDraggingRef.current ||
            !dragStartPointRef.current ||
            !dragOriginalSceneRef.current ||
            !interactionModeRef.current ||
            !activeObjectIdRef.current
        ) {
            return false;
        }

        const point = getCanvasPoint(event);

        if (!point) {
            return false;
        }

        event.preventDefault();
        event.stopPropagation();

        const dx = point.x - dragStartPointRef.current.x;
        const dy = point.y - dragStartPointRef.current.y;

        const originalScene = dragOriginalSceneRef.current;
        const interactionMode = interactionModeRef.current;
        const activeObjectId = activeObjectIdRef.current;

        setPreviewScene({
            ...originalScene,
            objects: originalScene.objects.map((object) => {
                if (object.id !== activeObjectId || object.locked) {
                    return object;
                }

                if (interactionMode.type === 'move') {
                    return moveObject(object, dx, dy);
                }

                if (
                    interactionMode.type === 'resize' &&
                    object.type === 'shape'
                ) {
                    return resizeShapeObject(
                        object,
                        point,
                        interactionMode.handle,
                    );
                }

                if (
                    interactionMode.type === 'rotate' &&
                    object.type === 'shape'
                ) {
                    return rotateShapeObject(object, point, interactionMode);
                }

                return object;
            }),
        });

        return true;
    };

    const handleSelectionPointerUp = (
        event: React.PointerEvent<HTMLDivElement>,
    ) => {
        if (!isDraggingRef.current) {
            return false;
        }

        event.preventDefault();
        event.stopPropagation();

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        if (previewScene) {
            onSceneCommit(previewScene);
        }

        dragStartPointRef.current = null;
        dragOriginalSceneRef.current = null;
        interactionModeRef.current = null;
        activeObjectIdRef.current = null;
        isDraggingRef.current = false;
        setPreviewScene(null);

        return true;
    };

    return {
        visibleScene,
        handleSelectionPointerDown,
        handleSelectionPointerMove,
        handleSelectionPointerUp,
    };
}
