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

type EditableTextCanvasObject = FabricObject & {
    text?: string;
    enterEditing?: () => void;
    selectAll?: () => void;
    hiddenTextarea?: HTMLTextAreaElement | null;
};

function lockHiddenTextareaPosition(target?: FabricObject) {
    const textarea = (target as EditableTextCanvasObject | undefined)
        ?.hiddenTextarea;

    if (!textarea) {
        return;
    }

    textarea.setAttribute('aria-hidden', 'true');

    Object.assign(textarea.style, {
        position: 'fixed',
        left: '0px',
        top: '0px',
        width: '1px',
        height: '1px',
        maxWidth: '1px',
        maxHeight: '1px',
        opacity: '0',
        overflow: 'hidden',
        transform: 'none',
        zIndex: '-1',
    });
}

function preloadImage(src: string) {
    return new Promise<void>((resolve) => {
        const image = new Image();

        image.onload = () => resolve();
        image.onerror = () => resolve();

        image.src = src;
    });
}

function preloadSceneImages(scene: EditorScene) {
    const imageSources = scene.objects
        .filter((object) => object.type === 'image')
        .map((object) => object.src);

    if (imageSources.length === 0) {
        return Promise.resolve();
    }

    return Promise.all(imageSources.map(preloadImage)).then(() => undefined);
}

function getAppendedObject(
    previousScene: EditorScene | null,
    nextScene: EditorScene,
) {
    if (!previousScene) {
        return null;
    }

    if (previousScene.background.color !== nextScene.background.color) {
        return null;
    }

    if (nextScene.objects.length !== previousScene.objects.length + 1) {
        return null;
    }

    const previousObjectIds = new Set(
        previousScene.objects.map((object) => object.id),
    );

    const appendedObject = nextScene.objects.find(
        (object) => !previousObjectIds.has(object.id),
    );

    if (!appendedObject) {
        return null;
    }

    const previousObjectsStillSame = previousScene.objects.every(
        (previousObject, index) =>
            nextScene.objects[index]?.id === previousObject.id,
    );

    if (!previousObjectsStillSame) {
        return null;
    }

    return appendedObject;
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
    const latestIsInteractionDisabledRef = useRef(isInteractionDisabled);
    const latestOnObjectSelectRef = useRef(onObjectSelect);
    const latestOnSceneCommitRef = useRef(onSceneCommit);
    const isProgrammaticCanvasUpdateRef = useRef(false);

    const renderedSceneRef = useRef<EditorScene | null>(null);
    const renderedCanvasSizeRef = useRef({
        width: canvasWidth,
        height: canvasHeight,
    });

    useEffect(() => {
        latestSelectedObjectIdsRef.current = selectedObjectIds;
    }, [selectedObjectIds]);

    useEffect(() => {
        latestSceneRef.current = scene;
    }, [scene]);

    useEffect(() => {
        latestOnObjectSelectRef.current = onObjectSelect;
    }, [onObjectSelect]);

    useEffect(() => {
        latestOnSceneCommitRef.current = onSceneCommit;
    }, [onSceneCommit]);

    useEffect(() => {
        latestIsInteractionDisabledRef.current = isInteractionDisabled;

        const canvas = canvasInstanceRef.current;

        if (!canvas) {
            return;
        }

        canvas.selection = !isInteractionDisabled;
        canvas.skipTargetFind = isInteractionDisabled;

        canvas.getObjects().forEach((object) => {
            object.set({
                selectable: !isInteractionDisabled,
                evented: !isInteractionDisabled,
            });
        });

        canvas.requestRenderAll();
    }, [isInteractionDisabled]);

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
            hiddenTextareaContainer: canvasElement.parentElement ?? undefined,
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
            latestOnObjectSelectRef.current(objectIds);
        };

        const handleSelectionChange = () => {
            if (isProgrammaticCanvasUpdateRef.current) {
                return;
            }

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
            if (isProgrammaticCanvasUpdateRef.current) {
                return;
            }

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

            latestOnSceneCommitRef.current(nextScene);
        };

        const handleTextEditingExited = (event: { target?: FabricObject }) => {
            if (!event.target) {
                return;
            }

            lockHiddenTextareaPosition(event.target);

            const objectId = getEditorObjectId(event.target);

            if (!objectId) {
                return;
            }

            const textValue =
                (event.target as EditableTextCanvasObject).text ?? '';

            const nextScene: EditorScene = {
                ...latestSceneRef.current,
                objects: latestSceneRef.current.objects.map((object) => {
                    if (object.id !== objectId || object.type !== 'text') {
                        return object;
                    }

                    if (object.locked) {
                        return object;
                    }

                    return {
                        ...object,
                        text: textValue,
                    };
                }),
            };

            latestSceneRef.current = nextScene;
            latestOnSceneCommitRef.current(nextScene);
        };
        const handleTextEditingEntered = (event: { target?: FabricObject }) => {
            lockHiddenTextareaPosition(event.target);
        };

        const handleTextChanged = (event: { target?: FabricObject }) => {
            lockHiddenTextareaPosition(event.target);
        };

        canvas.on('selection:created', handleSelectionChange);
        canvas.on('selection:updated', handleSelectionChange);
        canvas.on('selection:cleared', handleSelectionCleared);
        canvas.on('object:modified', handleObjectModified);
        canvas.on('text:editing:entered', handleTextEditingEntered);
        canvas.on('text:changed', handleTextChanged);
        canvas.on('text:editing:exited', handleTextEditingExited);

        return () => {
            canvas.off('selection:created', handleSelectionChange);
            canvas.off('selection:updated', handleSelectionChange);
            canvas.off('selection:cleared', handleSelectionCleared);
            canvas.off('object:modified', handleObjectModified);
            canvas.off('text:editing:entered', handleTextEditingEntered);
            canvas.off('text:changed', handleTextChanged);
            canvas.off('text:editing:exited', handleTextEditingExited);
            canvas.off('text:editing:exited', handleTextEditingExited);

            canvasInstanceRef.current = null;
            void canvas.dispose();
        };
    }, [canvasElementRef]);

    useEffect(() => {
        const canvas = canvasInstanceRef.current;

        if (!canvas) {
            return;
        }

        const currentCanvas = canvas;
        let isCancelled = false;

        const previousRenderedScene = renderedSceneRef.current;
        const previousCanvasSize = renderedCanvasSizeRef.current;

        const appendedObject = getAppendedObject(previousRenderedScene, scene);

        const canRenderOnlyAppendedObject =
            appendedObject &&
            previousCanvasSize.width === canvasWidth &&
            previousCanvasSize.height === canvasHeight;

        async function renderScene() {
            const shouldDisableInteraction =
                latestIsInteractionDisabledRef.current;

            if (canRenderOnlyAppendedObject && appendedObject) {
                const canvasObject = await createCanvasObject(appendedObject);

                if (isCancelled) {
                    return;
                }

                canvasObject.set({
                    selectable: !shouldDisableInteraction,
                    evented: !shouldDisableInteraction,
                });

                currentCanvas.add(canvasObject);

                renderedSceneRef.current = scene;
                renderedCanvasSizeRef.current = {
                    width: canvasWidth,
                    height: canvasHeight,
                };

                isProgrammaticCanvasUpdateRef.current = true;

                try {
                    restoreCanvasSelection(
                        currentCanvas,
                        latestSelectedObjectIdsRef.current,
                    );
                } finally {
                    isProgrammaticCanvasUpdateRef.current = false;
                }

                currentCanvas.requestRenderAll();
                return;
            }

            await preloadSceneImages(scene);

            if (isCancelled) {
                return;
            }

            const canvasObjects = await Promise.all(
                scene.objects.map((object) => createCanvasObject(object)),
            );

            if (isCancelled) {
                return;
            }

            currentCanvas.setDimensions({
                width: canvasWidth,
                height: canvasHeight,
            });

            currentCanvas.backgroundColor = scene.background.color;

            isProgrammaticCanvasUpdateRef.current = true;

            try {
                currentCanvas.clear();

                currentCanvas.selection = !shouldDisableInteraction;
                currentCanvas.skipTargetFind = shouldDisableInteraction;

                canvasObjects.forEach((object) => {
                    object.set({
                        selectable: !shouldDisableInteraction,
                        evented: !shouldDisableInteraction,
                    });
                });

                canvasObjects.forEach((object) => {
                    currentCanvas.add(object);
                });

                renderedSceneRef.current = scene;
                renderedCanvasSizeRef.current = {
                    width: canvasWidth,
                    height: canvasHeight,
                };

                restoreCanvasSelection(
                    currentCanvas,
                    latestSelectedObjectIdsRef.current,
                );
            } finally {
                isProgrammaticCanvasUpdateRef.current = false;
            }

            currentCanvas.requestRenderAll();
        }
        void renderScene();

        return () => {
            isCancelled = true;
        };
    }, [scene, canvasWidth, canvasHeight]);

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
