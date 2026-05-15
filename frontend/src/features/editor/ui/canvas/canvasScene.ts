// src/features/editor/ui/canvas/canvasScene.ts
import { useEffect, useRef } from 'react';
import { ActiveSelection, Canvas } from 'fabric';
import type { FabricObject } from 'fabric';
import type { EditorScene } from '../../model/editorTypes';
import {
    configureEditorControls,
    createCanvasObject,
    getEditorObjectId,
} from './canvasObjects';
import { updateSceneObjectsFromCanvasObjects } from './canvasObjectTransform';

type FabricObjectWithChildren = FabricObject & {
    getObjects?: () => FabricObject[];
};

function isActiveSelection(canvasObject: FabricObject) {
    return (
        typeof (canvasObject as FabricObjectWithChildren).getObjects ===
        'function'
    );
}

function configureSelectionControls(canvasObject: FabricObject) {
    if (!isActiveSelection(canvasObject)) {
        return;
    }

    configureEditorControls(canvasObject);

    canvasObject.set({
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false,
        lockScalingX: false,
        lockScalingY: false,
        lockRotation: false,
        lockUniScaling: false,
        lockScalingFlip: true,
    });

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

    canvasObject.setCoords();
}

function areStringArraysEqual(first: string[], second: string[]) {
    if (first.length !== second.length) {
        return false;
    }

    const firstSorted = [...first].sort();
    const secondSorted = [...second].sort();

    return firstSorted.every((value, index) => value === secondSorted[index]);
}
function restoreCanvasSelection(canvas: Canvas, selectedObjectIds: string[]) {
    const canvasObjects = canvas.getObjects() as FabricObject[];

    const selectedCanvasObjects = selectedObjectIds
        .map((selectedObjectId) =>
            canvasObjects.find(
                (object) => getEditorObjectId(object) === selectedObjectId,
            ),
        )
        .filter((object): object is FabricObject => Boolean(object));

    if (selectedObjectIds.length > 1 && selectedCanvasObjects.length > 1) {
        const activeObject = canvas.getActiveObject();

        const currentSelectedIds =
            activeObject && isActiveSelection(activeObject)
                ? ((activeObject as FabricObjectWithChildren)
                      .getObjects?.()
                      .map((object) => getEditorObjectId(object))
                      .filter((id): id is string => Boolean(id)) ?? [])
                : [];

        if (areStringArraysEqual(currentSelectedIds, selectedObjectIds)) {
            configureSelectionControls(activeObject as FabricObject);
            canvas.requestRenderAll();
            return;
        }

        const activeSelection = new ActiveSelection(selectedCanvasObjects, {
            canvas,
        });

        configureSelectionControls(activeSelection);
        canvas.setActiveObject(activeSelection);
        canvas.requestRenderAll();
        return;
    }

    if (selectedObjectIds.length === 1 && selectedCanvasObjects[0]) {
        const activeObject = canvas.getActiveObject();

        if (
            activeObject &&
            getEditorObjectId(activeObject) === selectedObjectIds[0]
        ) {
            canvas.requestRenderAll();
            return;
        }

        canvas.setActiveObject(selectedCanvasObjects[0]);
        canvas.requestRenderAll();
        return;
    }

    if (selectedObjectIds.length === 0) {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
    }
}

type UseCanvasSceneParams = {
    scene: EditorScene;
    canvasWidth: number;
    canvasHeight: number;
    selectedObjectIds: string[];
    onObjectSelect: (objectIds: string[]) => void;
    canvasElementRef: React.RefObject<HTMLCanvasElement | null>;
    onSceneCommit: (scene: EditorScene) => void;
    isInteractionDisabled: boolean;
};

export function useCanvasScene({
    scene,
    canvasWidth,
    canvasHeight,
    selectedObjectIds,
    canvasElementRef,
    onObjectSelect,
    onSceneCommit,
    isInteractionDisabled,
}: UseCanvasSceneParams) {
    const canvasInstanceRef = useRef<Canvas | null>(null);
    const latestSceneRef = useRef(scene);
    const latestSelectedObjectIdsRef = useRef(selectedObjectIds);

    useEffect(() => {
        latestSelectedObjectIdsRef.current = selectedObjectIds;
    }, [selectedObjectIds]);

    useEffect(() => {
        latestSceneRef.current = scene;
    }, [scene]);

    useEffect(() => {
        const canvasElement = canvasElementRef.current;

        if (!canvasElement) {
            return;
        }

        const canvas = new Canvas(canvasElement, {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: scene.background.color,
            selection: false,
            preserveObjectStacking: true,
        });

        canvasInstanceRef.current = canvas;

        const emitSelectedObjectIds = (objectIds: string[]) => {
            if (
                areStringArraysEqual(
                    latestSelectedObjectIdsRef.current,
                    objectIds,
                )
            ) {
                return;
            }

            latestSelectedObjectIdsRef.current = objectIds;
            onObjectSelect(objectIds);
        };

        const handleSelectionChange = () => {
            const activeObject = canvas.getActiveObject();

            if (!activeObject) {
                emitSelectedObjectIds([]);
                return;
            }

            configureSelectionControls(activeObject);

            if (isActiveSelection(activeObject)) {
                const selectedObjectIds =
                    (activeObject as FabricObjectWithChildren)
                        .getObjects?.()
                        .map((object) => getEditorObjectId(object))
                        .filter((id): id is string => Boolean(id)) ?? [];

                emitSelectedObjectIds(selectedObjectIds);
                canvas.requestRenderAll();
                return;
            }

            const objectId = getEditorObjectId(activeObject);

            emitSelectedObjectIds(objectId ? [objectId] : []);
            canvas.requestRenderAll();
        };

        const handleSelectionCleared = () => {
            emitSelectedObjectIds([]);
        };

        const handleObjectModified = (event: { target?: FabricObject }) => {
            if (!event.target) {
                return;
            }

            const target = event.target as FabricObjectWithChildren;

            const modifiedObjects =
                typeof target.getObjects === 'function'
                    ? target.getObjects()
                    : [event.target];

            modifiedObjects.forEach((object) => {
                object.setCoords();
            });

            const nextScene = updateSceneObjectsFromCanvasObjects(
                latestSceneRef.current,
                modifiedObjects,
            );

            latestSceneRef.current = nextScene;

            onSceneCommit(nextScene);
        };

        canvas.on('selection:created', handleSelectionChange);
        canvas.on('selection:updated', handleSelectionChange);
        canvas.on('selection:cleared', handleSelectionCleared);
        canvas.on('object:modified', handleObjectModified);

        return () => {
            canvas.off('selection:created', handleSelectionChange);
            canvas.off('selection:updated', handleSelectionChange);
            canvas.off('selection:cleared', handleSelectionCleared);
            canvas.off('object:modified', handleObjectModified);

            canvasInstanceRef.current = null;
            void canvas.dispose();
        };
    }, [
        canvasElementRef,
        canvasHeight,
        canvasWidth,
        onObjectSelect,
        onSceneCommit,
        scene.background.color,
    ]);

useEffect(() => {
    const canvas = canvasInstanceRef.current;

    if (!canvas) {
        return;
    }

    canvas.setDimensions({
        width: canvasWidth,
        height: canvasHeight,
    });

    canvas.selection = !isInteractionDisabled;
    canvas.skipTargetFind = isInteractionDisabled;

    let isCancelled = false;

    // void Promise.all(
    //     scene.objects.map((object) => createCanvasObject(object)),
    // ).then((canvasObjects) => {
    void Promise.allSettled(
    scene.objects.map((object) => createCanvasObject(object)),
).then((results) => {
    const canvasObjects = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);

    if (isCancelled) {
        return;
    }
        if (isCancelled) {
            return;
        }

        canvas.clear();
        canvas.backgroundColor = scene.background.color;

        canvasObjects.forEach((object) => {
            object.set({
                selectable: !isInteractionDisabled,
                evented: !isInteractionDisabled,
            });
        });

        canvasObjects.forEach((object) => {
            canvas.add(object);
        });

        restoreCanvasSelection(canvas, latestSelectedObjectIdsRef.current);
        canvas.requestRenderAll();
    });

    return () => {
        isCancelled = true;
    };
}, [scene, canvasWidth, canvasHeight, isInteractionDisabled]);

    useEffect(() => {
        const canvas = canvasInstanceRef.current;

        if (!canvas) {
            return;
        }

        restoreCanvasSelection(canvas, selectedObjectIds);
    }, [selectedObjectIds]);

    return {
        canvasInstanceRef,
    };
}
