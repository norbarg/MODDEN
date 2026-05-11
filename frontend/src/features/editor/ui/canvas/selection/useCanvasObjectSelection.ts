// src/features/editor/ui/canvas/selection/useCanvasObjectSelection.ts
import { useRef, useState } from 'react';
import type {
    EditorDrawObject,
    EditorScene,
    EditorSceneObject,
} from '../../../model/editorTypes';

type CanvasPoint = {
    x: number;
    y: number;
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

function findObjectAtPoint(objects: EditorSceneObject[], point: CanvasPoint) {
    for (let index = objects.length - 1; index >= 0; index -= 1) {
        const object = objects[index];

        if (object.type === 'draw' && object.tool !== 'eraser') {
            if (isPointOnDrawObject(point, object)) {
                return object;
            }
        }
    }

    return null;
}

function moveObject(object: EditorSceneObject, dx: number, dy: number) {
    if (object.type !== 'draw') {
        return object;
    }

    return {
        ...object,
        points: object.points.map((point) => ({
            x: point.x + dx,
            y: point.y + dy,
        })),
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

        const clickedObject = findObjectAtPoint(scene.objects, point);

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
        dragOriginalSceneRef.current = getLatestScene();
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
            !selectedObjectId
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

        setPreviewScene({
            ...originalScene,
            objects: originalScene.objects.map((object) => {
                if (object.id !== selectedObjectId) {
                    return object;
                }

                return moveObject(object, dx, dy);
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
