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

export type EditorImageFilterValues = {
    brightness: number;
    contrast: number;
    saturation: number;
    grayscale: number;
    sepia: number;
    blur: number;
    invert: number;
};

export type EditorImageObject = {
    id: string;
    type: 'image';
    assetId: string;
    src: string;
    fileName: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    filters: EditorImageFilterValues;
    locked?: boolean;
};

export type EditorTextFontWeight = '400' | '500' | '700';

export type EditorTextObject = {
    id: string;
    type: 'text';
    text: string;

    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;

    fontFamily: string;
    fontWeight: EditorTextFontWeight;
    fontSize: number;
    color: string;

    locked?: boolean;
};

export type EditorUploadedImage = {
    id: string;
    src: string;
    fileName: string;
};

export type EditorSceneObject =
    | EditorDrawObject
    | EditorShapeObject
    | EditorImageObject
    | EditorTextObject;

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
