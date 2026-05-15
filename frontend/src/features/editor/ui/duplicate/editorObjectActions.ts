// src/features/editor/ui/duplicate/editorObjectActions.ts
import type {
    EditorDrawObject,
    EditorImageObject,
    EditorScene,
    EditorSceneObject,
    EditorShapeObject,
} from '../../model/editorTypes';

const DUPLICATE_OFFSET = 24;

function createObjectId(prefix = 'object') {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function duplicateDrawObject(object: EditorDrawObject): EditorDrawObject {
    return {
        ...object,
        id: createObjectId('draw'),
        x: object.x + DUPLICATE_OFFSET,
        y: object.y + DUPLICATE_OFFSET,
        locked: false,
    };
}

function duplicateShapeObject(object: EditorShapeObject): EditorShapeObject {
    return {
        ...object,
        id: createObjectId('shape'),
        x: object.x + DUPLICATE_OFFSET,
        y: object.y + DUPLICATE_OFFSET,
        locked: false,
    };
}

function duplicateImageObject(object: EditorImageObject): EditorImageObject {
    return {
        ...object,
        id: createObjectId('image'),
        x: object.x + DUPLICATE_OFFSET,
        y: object.y + DUPLICATE_OFFSET,
        locked: false,
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
    } else if (object.type === 'shape') {
        duplicatedObject = duplicateShapeObject(object);
    } else if (object.type === 'image') {
        duplicatedObject = duplicateImageObject(object);
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
