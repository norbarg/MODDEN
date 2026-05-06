// src/features/editor/model/editorTypes.ts

export type EditorPanel =
    | 'tools'
    | 'shapes'
    | 'text'
    | 'images'
    | 'uploads'
    | null;

export type EditorScene = {
    version: 1;
    background: {
        type: 'color';
        color: string;
    };
    objects: [];
};

export type EditorProjectMeta = {
    id: string;
    title: string;
    canvasWidth: number;
    canvasHeight: number;
};
