// src/features/editor/model/editorDefaults.ts
import type { EditorScene } from './editorTypes';

export const DEFAULT_EDITOR_SCENE: EditorScene = {
    version: 1,
    background: {
        type: 'color',
        color: '#ffffff',
    },
    objects: [],
};

export function normalizeEditorScene(
    sceneJson: Record<string, unknown> | null | undefined,
): EditorScene {
    if (
        sceneJson &&
        sceneJson.version === 1 &&
        typeof sceneJson.background === 'object' &&
        Array.isArray(sceneJson.objects)
    ) {
        return sceneJson as EditorScene;
    }

    return DEFAULT_EDITOR_SCENE;
}
