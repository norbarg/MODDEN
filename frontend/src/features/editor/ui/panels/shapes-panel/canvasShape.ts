// src/features/editor/ui/panels/shapes-panel/canvasShape.ts
import type { PointerEvent, RefObject } from 'react';
import type {
    EditorOption,
    EditorScene,
    EditorShapeObject,
    EditorShapeType,
} from '../../../model/editorTypes';

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

export function getActiveShapeType(activeOption: EditorOption) {
    if (activeOption?.panel === 'shapes' && isShapeType(activeOption.id)) {
        return activeOption.id;
    }

    return null;
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

function getCanvasPoint(
    event: PointerEvent<HTMLDivElement>,
    canvasRef: RefObject<HTMLDivElement | null>,
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

type PlaceShapeOnCanvasParams = {
    event: PointerEvent<HTMLDivElement>;
    activeShapeType: EditorShapeType | null;
    canvasScale: number;
    canvasRef: RefObject<HTMLDivElement | null>;
    getLatestScene: () => EditorScene;
    onSceneCommit: (scene: EditorScene) => void;
    onObjectSelect: (objectIds: string[]) => void;
    onOptionChange: (option: EditorOption) => void;
};

export function placeShapeOnCanvas({
    event,
    activeShapeType,
    canvasScale,
    canvasRef,
    getLatestScene,
    onSceneCommit,
    onObjectSelect,
    onOptionChange,
}: PlaceShapeOnCanvasParams) {
    if (!activeShapeType) {
        return false;
    }

    const point = getCanvasPoint(event, canvasRef, canvasScale);

    if (!point) {
        return false;
    }

    event.preventDefault();
    event.stopPropagation();

    const newShape = createShapeObject(activeShapeType, point.x, point.y);
    const latestScene = getLatestScene();

    onSceneCommit({
        ...latestScene,
        objects: [...latestScene.objects, newShape],
    });

    onObjectSelect([newShape.id]);
    onOptionChange(null);

    return true;
}
