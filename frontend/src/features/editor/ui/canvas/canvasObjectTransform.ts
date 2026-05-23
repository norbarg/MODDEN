// src/features/editor/ui/canvas/canvasObjectTransform.ts
import { util } from 'fabric';
import type { FabricObject } from 'fabric';
import type {
    EditorDrawObject,
    EditorImageObject,
    EditorScene,
    EditorSceneObject,
    EditorShapeObject,
    EditorTextObject,
} from '../../model/editorTypes';
import { getEditorObjectId } from './canvasObjects';

type ObjectTransform = {
    centerX: number;
    centerY: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
};

function getObjectTransform(canvasObject: FabricObject): ObjectTransform {
    const matrix = canvasObject.calcTransformMatrix();
    const options = util.qrDecompose(matrix);

    return {
        centerX: options.translateX,
        centerY: options.translateY,
        scaleX: Math.abs(options.scaleX),
        scaleY: Math.abs(options.scaleY),
        rotation: options.angle,
    };
}

function updateShapeObjectFromCanvasObject(
    object: EditorShapeObject,
    canvasObject: FabricObject,
): EditorShapeObject {
    const transform = getObjectTransform(canvasObject);

    const baseWidth = canvasObject.width ?? object.width;
    const baseHeight = canvasObject.height ?? object.height;

    const width = Math.max(1, baseWidth * transform.scaleX);
    const height = Math.max(1, baseHeight * transform.scaleY);

    return {
        ...object,
        x: transform.centerX - width / 2,
        y: transform.centerY - height / 2,
        width,
        height,
        rotation: transform.rotation,
    };
}

function updateImageObjectFromCanvasObject(
    object: EditorImageObject,
    canvasObject: FabricObject,
): EditorImageObject {
    const transform = getObjectTransform(canvasObject);

    const baseWidth = canvasObject.width ?? object.width;
    const baseHeight = canvasObject.height ?? object.height;

    const width = Math.max(1, baseWidth * transform.scaleX);
    const height = Math.max(1, baseHeight * transform.scaleY);

    return {
        ...object,
        x: transform.centerX - width / 2,
        y: transform.centerY - height / 2,
        width,
        height,
        rotation: transform.rotation,
    };
}

function updateTextObjectFromCanvasObject(
    object: EditorTextObject,
    canvasObject: FabricObject,
): EditorTextObject {
    const transform = getObjectTransform(canvasObject);

    const baseWidth = canvasObject.width ?? object.width;
    const baseHeight = canvasObject.height ?? object.height;

    const width = Math.max(1, baseWidth * transform.scaleX);
    const height = Math.max(1, baseHeight * transform.scaleY);

    return {
        ...object,
        x: transform.centerX - width / 2,
        y: transform.centerY - height / 2,
        width,
        height,
        fontSize: Math.max(1, object.fontSize * transform.scaleY),
        rotation: transform.rotation,
    };
}

function updateDrawObjectFromCanvasObject(
    object: EditorDrawObject,
    canvasObject: FabricObject,
): EditorDrawObject {
    const transform = getObjectTransform(canvasObject);

    const baseWidth = canvasObject.width ?? 0;
    const baseHeight = canvasObject.height ?? 0;

    return {
        ...object,
        x: transform.centerX - (baseWidth * transform.scaleX) / 2,
        y: transform.centerY - (baseHeight * transform.scaleY) / 2,
        scaleX: transform.scaleX,
        scaleY: transform.scaleY,
        rotation: transform.rotation,
    };
}

export function updateSceneObjectFromCanvasObject(
    scene: EditorScene,
    canvasObject: FabricObject,
): EditorScene {
    const objectId = getEditorObjectId(canvasObject);

    if (!objectId) {
        return scene;
    }

    return {
        ...scene,
        objects: scene.objects.map((object): EditorSceneObject => {
            if (object.id !== objectId) {
                return object;
            }

            if (object.locked) {
                return object;
            }

            if (object.type === 'shape') {
                return updateShapeObjectFromCanvasObject(object, canvasObject);
            }

            if (object.type === 'image') {
                return updateImageObjectFromCanvasObject(object, canvasObject);
            }

            if (object.type === 'text') {
                return updateTextObjectFromCanvasObject(object, canvasObject);
            }

            return updateDrawObjectFromCanvasObject(object, canvasObject);
        }),
    };
}

export function updateSceneObjectsFromCanvasObjects(
    scene: EditorScene,
    canvasObjects: FabricObject[],
): EditorScene {
    return canvasObjects.reduce(
        (currentScene, canvasObject) =>
            updateSceneObjectFromCanvasObject(currentScene, canvasObject),
        scene,
    );
}
