// src/features/editor/model/useEditorHistory.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorScene } from './editorTypes';

const EDITOR_HISTORY_LIMIT = 30;

type SceneUpdater = EditorScene | ((currentScene: EditorScene) => EditorScene);

type UseEditorHistoryParams = {
    initialScene: EditorScene;
    hotkeysDisabled?: boolean;
};

function cloneScene(scene: EditorScene) {
    return JSON.parse(JSON.stringify(scene)) as EditorScene;
}

function serializeScene(scene: EditorScene) {
    return JSON.stringify(scene);
}

function isSameScene(firstScene: EditorScene, secondScene: EditorScene) {
    return serializeScene(firstScene) === serializeScene(secondScene);
}

function trimHistory(history: EditorScene[]) {
    return history.slice(-EDITOR_HISTORY_LIMIT);
}

function resolveSceneUpdater(updater: SceneUpdater, currentScene: EditorScene) {
    if (typeof updater === 'function') {
        return updater(currentScene);
    }

    return updater;
}

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

export function useEditorHistory({
    initialScene,
    hotkeysDisabled = false,
}: UseEditorHistoryParams) {
    const [scene, setSceneState] = useState<EditorScene>(initialScene);
    const [pastScenes, setPastScenesState] = useState<EditorScene[]>([]);
    const [futureScenes, setFutureScenesState] = useState<EditorScene[]>([]);
    const [isSceneDirty, setIsSceneDirty] = useState(false);

    const sceneRef = useRef<EditorScene>(initialScene);
    const pastScenesRef = useRef<EditorScene[]>([]);
    const futureScenesRef = useRef<EditorScene[]>([]);

    const lastSavedSceneRef = useRef(serializeScene(initialScene));
    const transactionStartSceneRef = useRef<EditorScene | null>(null);

    const syncScene = useCallback((nextScene: EditorScene) => {
        sceneRef.current = nextScene;
        setSceneState(nextScene);
    }, []);

    const syncPastScenes = useCallback((nextPastScenes: EditorScene[]) => {
        pastScenesRef.current = nextPastScenes;
        setPastScenesState(nextPastScenes);
    }, []);

    const syncFutureScenes = useCallback((nextFutureScenes: EditorScene[]) => {
        futureScenesRef.current = nextFutureScenes;
        setFutureScenesState(nextFutureScenes);
    }, []);

    const updateDirtyState = useCallback((nextScene: EditorScene) => {
        setIsSceneDirty(
            serializeScene(nextScene) !== lastSavedSceneRef.current,
        );
    }, []);

    const pushPastScene = useCallback(
        (previousScene: EditorScene, currentScene: EditorScene) => {
            if (isSameScene(previousScene, currentScene)) {
                return;
            }

            const currentPastScenes = pastScenesRef.current;
            const lastPastScene =
                currentPastScenes[currentPastScenes.length - 1];

            if (lastPastScene && isSameScene(lastPastScene, previousScene)) {
                syncFutureScenes([]);
                updateDirtyState(currentScene);
                return;
            }

            syncPastScenes(
                trimHistory([...currentPastScenes, cloneScene(previousScene)]),
            );

            syncFutureScenes([]);
            updateDirtyState(currentScene);
        },
        [syncPastScenes, syncFutureScenes, updateDirtyState],
    );

    const commitActiveTransaction = useCallback(() => {
        const transactionStartScene = transactionStartSceneRef.current;

        if (!transactionStartScene) {
            return;
        }

        pushPastScene(transactionStartScene, sceneRef.current);
        transactionStartSceneRef.current = null;
    }, [pushPastScene]);

    const resetScene = useCallback(
        (nextScene: EditorScene, markAsSaved = true) => {
            transactionStartSceneRef.current = null;

            syncScene(nextScene);
            syncPastScenes([]);
            syncFutureScenes([]);

            if (markAsSaved) {
                lastSavedSceneRef.current = serializeScene(nextScene);
                setIsSceneDirty(false);
                return;
            }

            updateDirtyState(nextScene);
        },
        [syncScene, syncPastScenes, syncFutureScenes, updateDirtyState],
    );

    const startSceneTransaction = useCallback(() => {
        if (transactionStartSceneRef.current) {
            commitActiveTransaction();
        }

        transactionStartSceneRef.current = cloneScene(sceneRef.current);
    }, [commitActiveTransaction]);

    const previewScene = useCallback(
        (updater: SceneUpdater) => {
            const currentScene = sceneRef.current;
            const nextScene = resolveSceneUpdater(updater, currentScene);

            if (isSameScene(currentScene, nextScene)) {
                return;
            }

            syncScene(nextScene);
            updateDirtyState(nextScene);
        },
        [syncScene, updateDirtyState],
    );

    const commitSceneTransaction = useCallback(() => {
        commitActiveTransaction();
    }, [commitActiveTransaction]);

    const applySceneChange = useCallback(
        (updater: SceneUpdater) => {
            commitActiveTransaction();

            const previousScene = cloneScene(sceneRef.current);
            const nextScene = resolveSceneUpdater(updater, sceneRef.current);

            if (isSameScene(previousScene, nextScene)) {
                return;
            }

            syncScene(nextScene);
            pushPastScene(previousScene, nextScene);
        },
        [commitActiveTransaction, pushPastScene, syncScene],
    );

    const undo = useCallback(() => {
        commitActiveTransaction();

        const currentScene = sceneRef.current;
        const nextPastScenes = [...pastScenesRef.current];

        let previousScene = nextPastScenes.pop();

        while (previousScene && isSameScene(previousScene, currentScene)) {
            previousScene = nextPastScenes.pop();
        }

        if (!previousScene) {
            syncPastScenes([]);
            return;
        }

        syncPastScenes(nextPastScenes);

        const currentFutureScenes = futureScenesRef.current;
        const firstFutureScene = currentFutureScenes[0];

        if (!firstFutureScene || !isSameScene(firstFutureScene, currentScene)) {
            syncFutureScenes(
                trimHistory([cloneScene(currentScene), ...currentFutureScenes]),
            );
        }

        syncScene(previousScene);
        updateDirtyState(previousScene);
    }, [
        commitActiveTransaction,
        syncPastScenes,
        syncFutureScenes,
        syncScene,
        updateDirtyState,
    ]);

    const redo = useCallback(() => {
        commitActiveTransaction();

        const currentScene = sceneRef.current;
        const nextFutureScenes = [...futureScenesRef.current];

        let nextScene = nextFutureScenes.shift();

        while (nextScene && isSameScene(nextScene, currentScene)) {
            nextScene = nextFutureScenes.shift();
        }

        if (!nextScene) {
            syncFutureScenes([]);
            return;
        }

        syncFutureScenes(nextFutureScenes);

        const currentPastScenes = pastScenesRef.current;
        const lastPastScene = currentPastScenes[currentPastScenes.length - 1];

        if (!lastPastScene || !isSameScene(lastPastScene, currentScene)) {
            syncPastScenes(
                trimHistory([...currentPastScenes, cloneScene(currentScene)]),
            );
        }

        syncScene(nextScene);
        updateDirtyState(nextScene);
    }, [
        commitActiveTransaction,
        syncPastScenes,
        syncFutureScenes,
        syncScene,
        updateDirtyState,
    ]);

    const markSceneAsSaved = useCallback((savedScene = sceneRef.current) => {
        transactionStartSceneRef.current = null;

        lastSavedSceneRef.current = serializeScene(savedScene);
        setIsSceneDirty(false);
    }, []);

    const restoreDraftHistory = useCallback(
        (data: {
            scene: EditorScene;
            pastScenes: EditorScene[];
            futureScenes: EditorScene[];
        }) => {
            transactionStartSceneRef.current = null;

            syncScene(data.scene);
            syncPastScenes(data.pastScenes);
            syncFutureScenes(data.futureScenes);

            updateDirtyState(data.scene);
        },
        [syncScene, syncPastScenes, syncFutureScenes, updateDirtyState],
    );

    useEffect(() => {
        if (hotkeysDisabled) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (isTypingTarget(event.target)) {
                return;
            }

            const hasModifier = event.ctrlKey || event.metaKey;

            if (!hasModifier) {
                return;
            }

            const isUndo = !event.shiftKey && event.code === 'KeyZ';

            const isRedo =
                event.code === 'KeyY' ||
                (event.shiftKey && event.code === 'KeyZ');

            if (isUndo) {
                event.preventDefault();
                event.stopPropagation();
                undo();
                return;
            }

            if (isRedo) {
                event.preventDefault();
                event.stopPropagation();
                redo();
            }
        };

        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [hotkeysDisabled, undo, redo]);

    return {
        scene,
        pastScenes,
        futureScenes,

        isSceneDirty,
        canUndo: pastScenes.length > 0,
        canRedo: futureScenes.length > 0,

        resetScene,

        startSceneTransaction,
        previewScene,
        commitSceneTransaction,

        applySceneChange,

        undo,
        redo,

        markSceneAsSaved,
        restoreDraftHistory,
    };
}
