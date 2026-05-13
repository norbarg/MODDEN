// src/features/editor/model/editorTypes.ts

export type EditorPanel =
    | 'tools'
    | 'shapes'
    | 'text'
    | 'images'
    | 'uploads'
    | null;

export type EditorOption = {
    panel: Exclude<EditorPanel, null>;
    id: string;
} | null;

export type EditorDrawingTool = 'pencil' | 'marker' | 'highliter' | 'eraser';
export type EditorDrawPathCommand = (string | number)[];

export type EditorDrawObject = {
    id: string;
    type: 'draw';
    tool: EditorDrawingTool;

    path: EditorDrawPathCommand[];

    color: string;
    strokeWidth: number;
    opacity: number;
    locked?: boolean;

    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
};

export type EditorShapeType =
    | 'square'
    | 'triangle'
    | 'circle'
    | 'diamond'
    | 'pentagon';

export type EditorShapeObject = {
    id: string;
    type: 'shape';
    shapeType: EditorShapeType;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    color: string;
    locked?: boolean;
};

export type EditorSceneObject = EditorDrawObject | EditorShapeObject;

export type EditorScene = {
    version: 1;
    background: {
        type: 'color';
        color: string;
    };
    objects: EditorSceneObject[];
};

export type EditorProjectMeta = {
    id: string;
    title: string;
    canvasWidth: number;
    canvasHeight: number;
};
