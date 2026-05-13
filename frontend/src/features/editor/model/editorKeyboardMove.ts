// src/features/editor/model/editorKeyboardMove.ts
import { useEffect, useRef } from 'react';
import type { EditorScene } from './editorTypes';

type KeyboardMoveDelta = {
    x: number;
    y: number;
};

type UseEditorKeyboardMoveParams = {
    selectedObjectIds: string[];
    isDisabled: boolean;
    startSceneTransaction: () => void;
    previewScene: (
        nextScene: EditorScene | ((currentScene: EditorScene) => EditorScene),
    ) => void;
    commitSceneTransaction: () => void;
};

function isTypingTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
    );
}

function getKeyboardMoveDelta(event: KeyboardEvent): KeyboardMoveDelta | null {
    const step = event.shiftKey ? 10 : 1;

    if (event.key === 'ArrowUp') {
        return { x: 0, y: -step };
    }

    if (event.key === 'ArrowDown') {
        return { x: 0, y: step };
    }

    if (event.key === 'ArrowLeft') {
        return { x: -step, y: 0 };
    }

    if (event.key === 'ArrowRight') {
        return { x: step, y: 0 };
    }

    return null;
}

function isArrowKey(key: string) {
    return (
        key === 'ArrowUp' ||
        key === 'ArrowDown' ||
        key === 'ArrowLeft' ||
        key === 'ArrowRight'
    );
}

function moveSelectedObjectsInScene(
    scene: EditorScene,
    selectedObjectIds: string[],
    delta: KeyboardMoveDelta,
): EditorScene {
    if (selectedObjectIds.length === 0) {
        return scene;
    }

    const selectedIds = new Set(selectedObjectIds);

    return {
        ...scene,
        objects: scene.objects.map((object) => {
            if (!selectedIds.has(object.id)) {
                return object;
            }

            if (object.locked) {
                return object;
            }

            return {
                ...object,
                x: object.x + delta.x,
                y: object.y + delta.y,
            };
        }),
    };
}

export function useEditorKeyboardMove({
    selectedObjectIds,
    isDisabled,
    startSceneTransaction,
    previewScene,
    commitSceneTransaction,
}: UseEditorKeyboardMoveParams) {
    const isKeyboardMovingRef = useRef(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isDisabled) {
                return;
            }

            if (isTypingTarget(event.target)) {
                return;
            }

            if (event.ctrlKey || event.metaKey || event.altKey) {
                return;
            }

            if (selectedObjectIds.length === 0) {
                return;
            }

            const delta = getKeyboardMoveDelta(event);

            if (!delta) {
                return;
            }

            event.preventDefault();

            if (!isKeyboardMovingRef.current) {
                startSceneTransaction();
                isKeyboardMovingRef.current = true;
            }

            previewScene((currentScene) =>
                moveSelectedObjectsInScene(
                    currentScene,
                    selectedObjectIds,
                    delta,
                ),
            );
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (!isArrowKey(event.key)) {
                return;
            }

            if (!isKeyboardMovingRef.current) {
                return;
            }

            commitSceneTransaction();
            isKeyboardMovingRef.current = false;
        };

        const handleBlur = () => {
            if (!isKeyboardMovingRef.current) {
                return;
            }

            commitSceneTransaction();
            isKeyboardMovingRef.current = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);

            if (isKeyboardMovingRef.current) {
                commitSceneTransaction();
                isKeyboardMovingRef.current = false;
            }
        };
    }, [
        selectedObjectIds,
        isDisabled,
        startSceneTransaction,
        previewScene,
        commitSceneTransaction,
    ]);
}
