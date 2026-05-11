// src/features/editor/ui/canvas/duplicate/duplicateEditorObject.ts
import type {
    EditorDrawObject,
    EditorScene,
    EditorSceneObject,
} from '../../model/editorTypes';

const DUPLICATE_OFFSET = 24;

function createObjectId(prefix = 'object') {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function duplicateDrawObject(object: EditorDrawObject): EditorDrawObject {
    return {
        ...object,
        id: createObjectId('draw'),
        points: object.points.map((point) => ({
            x: point.x + DUPLICATE_OFFSET,
            y: point.y + DUPLICATE_OFFSET,
        })),
    };
}

export function duplicateEditorObject(
    scene: EditorScene,
    objectId: string,
): {
    scene: EditorScene;
    duplicatedObject: EditorSceneObject | null;
} {
    const objectIndex = scene.objects.findIndex(
        (object) => object.id === objectId,
    );

    if (objectIndex === -1) {
        return {
            scene,
            duplicatedObject: null,
        };
    }

    const object = scene.objects[objectIndex];

    let duplicatedObject: EditorSceneObject;

    if (object.type === 'draw') {
        duplicatedObject = duplicateDrawObject(object);
    } else {
        return {
            scene,
            duplicatedObject: null,
        };
    }

    return {
        scene: {
            ...scene,
            objects: [
                ...scene.objects.slice(0, objectIndex + 1),
                duplicatedObject,
                ...scene.objects.slice(objectIndex + 1),
            ],
        },
        duplicatedObject,
    };
}
