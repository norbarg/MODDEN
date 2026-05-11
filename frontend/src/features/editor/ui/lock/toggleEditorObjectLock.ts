// src/features/editor/ui/canvas/lock/toggleEditorObjectLock.ts
import type { EditorScene, EditorSceneObject } from '../../model/editorTypes';

export function toggleEditorObjectLock(
    scene: EditorScene,
    objectId: string,
): {
    scene: EditorScene;
    updatedObject: EditorSceneObject | null;
} {
    let updatedObject: EditorSceneObject | null = null;

    const nextObjects = scene.objects.map((object) => {
        if (object.id !== objectId) {
            return object;
        }

        const nextObject = {
            ...object,
            locked: !object.locked,
        };

        updatedObject = nextObject;

        return nextObject;
    });

    return {
        scene: {
            ...scene,
            objects: nextObjects,
        },
        updatedObject,
    };
}
