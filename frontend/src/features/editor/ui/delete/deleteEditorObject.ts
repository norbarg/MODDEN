// src/features/editor/ui/canvas/delete/deleteEditorObject.ts
import type { EditorScene } from '../../model/editorTypes';

export function deleteEditorObject(
    scene: EditorScene,
    objectId: string,
): {
    scene: EditorScene;
    deleted: boolean;
} {
    const objectToDelete = scene.objects.find(
        (object) => object.id === objectId,
    );

    if (!objectToDelete) {
        return {
            scene,
            deleted: false,
        };
    }

    if (objectToDelete.locked) {
        return {
            scene,
            deleted: false,
        };
    }

    return {
        scene: {
            ...scene,
            objects: scene.objects.filter((object) => object.id !== objectId),
        },
        deleted: true,
    };
}
