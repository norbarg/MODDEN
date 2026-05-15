// src/features/editor/ui/canvas/canvasObjects.ts
import {
    Control,
    Ellipse,
    FabricImage,
    Path,
    Polygon,
    Rect,
    Triangle,
    controlsUtils,
    filters,
} from 'fabric';
import type { FabricObject } from 'fabric';
import type {
    EditorDrawObject,
    EditorImageFilterValues,
    EditorImageObject,
    EditorSceneObject,
    EditorShapeObject,
} from '../../model/editorTypes';

export type EditorCanvasObject = FabricObject & {
    editorObjectId?: string;
    editorObjectType?: EditorSceneObject['type'];
};

const SELECTION_COLOR = '#ff5a1f';

function renderInvisibleControl() {
    return undefined;
}

function makeExistingControlInvisible(control?: Control) {
    if (!control) {
        return;
    }

    control.render = renderInvisibleControl;
    control.sizeX = 28;
    control.sizeY = 28;
}

function createCornerRotateControl(
    x: number,
    y: number,
    offsetX: number,
    offsetY: number,
) {
    return new Control({
        x,
        y,
        offsetX,
        offsetY,
        visible: true,
        withConnection: false,
        sizeX: 32,
        sizeY: 32,
        touchSizeX: 44,
        touchSizeY: 44,
        actionName: 'rotate',
        actionHandler: controlsUtils.rotationWithSnapping,
        cursorStyle: 'grab',
        render: renderInvisibleControl,
    });
}

export function configureEditorControls(canvasObject: FabricObject) {
    canvasObject.setControlsVisibility({
        tl: true,
        tr: true,
        bl: true,
        br: true,
        mt: true,
        mb: true,
        ml: true,
        mr: true,
        mtr: false,
    });

    makeExistingControlInvisible(canvasObject.controls.mt);
    makeExistingControlInvisible(canvasObject.controls.mb);
    makeExistingControlInvisible(canvasObject.controls.ml);
    makeExistingControlInvisible(canvasObject.controls.mr);

    canvasObject.controls.rotateTopLeft = createCornerRotateControl(
        -0.5,
        -0.5,
        -24,
        -24,
    );

    canvasObject.controls.rotateTopRight = createCornerRotateControl(
        0.5,
        -0.5,
        24,
        -24,
    );

    canvasObject.controls.rotateBottomLeft = createCornerRotateControl(
        -0.5,
        0.5,
        -24,
        24,
    );

    canvasObject.controls.rotateBottomRight = createCornerRotateControl(
        0.5,
        0.5,
        24,
        24,
    );

    canvasObject.setControlsVisibility({
        tl: true,
        tr: true,
        bl: true,
        br: true,
        mt: true,
        mb: true,
        ml: true,
        mr: true,
        mtr: false,
        rotateTopLeft: true,
        rotateTopRight: true,
        rotateBottomLeft: true,
        rotateBottomRight: true,
    });
}

function applyEditorMeta(
    canvasObject: FabricObject,
    object: EditorSceneObject,
): EditorCanvasObject {
    const editorObject = canvasObject as EditorCanvasObject;

    editorObject.editorObjectId = object.id;
    editorObject.editorObjectType = object.type;

    editorObject.set({
        selectable: true,
        evented: true,
        hasControls: !object.locked,
        hasBorders: true,
        lockMovementX: Boolean(object.locked),
        lockMovementY: Boolean(object.locked),
        lockScalingX: Boolean(object.locked),
        lockScalingY: Boolean(object.locked),
        lockRotation: Boolean(object.locked),
        lockScalingFlip: true,
        borderColor: SELECTION_COLOR,
        cornerColor: '#ffffff',
        cornerStrokeColor: SELECTION_COLOR,
        cornerSize: 10,
        transparentCorners: false,
        padding: 0,
    });

    configureEditorControls(editorObject);

    return editorObject;
}

function createDrawCanvasObject(object: EditorDrawObject): EditorCanvasObject {
    const canvasObject = new Path(object.path as never, {
        fill: '',
        stroke: object.color,
        strokeWidth: object.strokeWidth,
        opacity: object.opacity,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        objectCaching: false,
    });

    const width = canvasObject.width ?? 0;
    const height = canvasObject.height ?? 0;

    canvasObject.set({
        left: object.x + (width * object.scaleX) / 2,
        top: object.y + (height * object.scaleY) / 2,
        originX: 'center',
        originY: 'center',
        scaleX: object.scaleX,
        scaleY: object.scaleY,
        angle: object.rotation,
    });

    return applyEditorMeta(canvasObject, object);
}

function getPentagonPoints(width: number, height: number) {
    return [
        { x: width / 2, y: 0 },
        { x: width, y: height * 0.36 },
        { x: width * 0.82, y: height },
        { x: width * 0.18, y: height },
        { x: 0, y: height * 0.36 },
    ];
}

function createPolygonShapeObject(
    object: EditorShapeObject,
    points: { x: number; y: number }[],
): EditorCanvasObject {
    const canvasObject = new Polygon(points, {
        left: object.x + object.width / 2,
        top: object.y + object.height / 2,
        originX: 'center',
        originY: 'center',
        width: object.width,
        height: object.height,
        angle: object.rotation,
        fill: object.color,
        objectCaching: false,
    });

    return applyEditorMeta(canvasObject, object);
}

function createShapeCanvasObject(
    object: EditorShapeObject,
): EditorCanvasObject {
    const commonProps = {
        left: object.x + object.width / 2,
        top: object.y + object.height / 2,
        originX: 'center' as const,
        originY: 'center' as const,
        width: object.width,
        height: object.height,
        angle: object.rotation,
        fill: object.color,
        objectCaching: false,
    };

    if (object.shapeType === 'square') {
        return applyEditorMeta(new Rect(commonProps), object);
    }

    if (object.shapeType === 'circle') {
        return applyEditorMeta(
            new Ellipse({
                left: object.x + object.width / 2,
                top: object.y + object.height / 2,
                originX: 'center',
                originY: 'center',
                rx: object.width / 2,
                ry: object.height / 2,
                angle: object.rotation,
                fill: object.color,
                objectCaching: false,
            }),
            object,
        );
    }

    if (object.shapeType === 'triangle') {
        return applyEditorMeta(new Triangle(commonProps), object);
    }

    if (object.shapeType === 'diamond') {
        return createPolygonShapeObject(object, [
            { x: object.width / 2, y: 0 },
            { x: object.width, y: object.height / 2 },
            { x: object.width / 2, y: object.height },
            { x: 0, y: object.height / 2 },
        ]);
    }

    return createPolygonShapeObject(
        object,
        getPentagonPoints(object.width, object.height),
    );
}

function createFabricImageFilters(filterValues: EditorImageFilterValues) {
    const imageFilters = [];

    if (filterValues.brightness !== 0) {
        imageFilters.push(
            new filters.Brightness({
                brightness: filterValues.brightness,
            }),
        );
    }

    if (filterValues.contrast !== 0) {
        imageFilters.push(
            new filters.Contrast({
                contrast: filterValues.contrast,
            }),
        );
    }

    if (filterValues.saturation !== 0) {
        imageFilters.push(
            new filters.Saturation({
                saturation: filterValues.saturation,
            }),
        );
    }

    if (filterValues.grayscale > 0) {
        imageFilters.push(new filters.Grayscale());
    }

    if (filterValues.sepia > 0) {
        imageFilters.push(new filters.Sepia());
    }

    if (filterValues.blur > 0) {
        imageFilters.push(
            new filters.Blur({
                blur: filterValues.blur,
            }),
        );
    }

    if (filterValues.invert > 0) {
        imageFilters.push(new filters.Invert());
    }

    return imageFilters;
}

async function createImageCanvasObject(
    object: EditorImageObject,
): Promise<EditorCanvasObject> {
    const image = await FabricImage.fromURL(object.src, {
        crossOrigin: 'anonymous',
    });

    image.set({
        left: object.x + object.width / 2,
        top: object.y + object.height / 2,
        originX: 'center',
        originY: 'center',
        scaleX: object.width / Math.max(1, image.width ?? object.width),
        scaleY: object.height / Math.max(1, image.height ?? object.height),
        angle: object.rotation,
        objectCaching: false,
    });

    image.filters = createFabricImageFilters(object.filters);
    image.applyFilters();

    return applyEditorMeta(image, object);
}

export async function createCanvasObject(
    object: EditorSceneObject,
): Promise<EditorCanvasObject> {
    if (object.type === 'draw') {
        return createDrawCanvasObject(object);
    }

    if (object.type === 'image') {
        return createImageCanvasObject(object);
    }

    return createShapeCanvasObject(object);
}

export function getEditorObjectId(canvasObject?: FabricObject | null) {
    if (!canvasObject) {
        return null;
    }

    return (canvasObject as EditorCanvasObject).editorObjectId ?? null;
}
