import { useEffect, useRef } from 'react';

type UseEditorHotkeysParams = {
    isDisabled: boolean;
    isSaving: boolean;
    isDirty: boolean;
    selectedObjectIds: string[];
    onQuickSave: () => void | Promise<void>;
    onDeleteSelected: () => void;
    onHotkeyHintsVisibleChange: (isVisible: boolean) => void;
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

function stopBrowserHotkey(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
}

export function useEditorHotkeys({
    isDisabled,
    isSaving,
    isDirty,
    selectedObjectIds,
    onQuickSave,
    onDeleteSelected,
    onHotkeyHintsVisibleChange,
}: UseEditorHotkeysParams) {
    const latestValuesRef = useRef({
        isDisabled,
        isSaving,
        isDirty,
        selectedObjectIds,
        onQuickSave,
        onDeleteSelected,
        onHotkeyHintsVisibleChange,
    });

    useEffect(() => {
        latestValuesRef.current = {
            isDisabled,
            isSaving,
            isDirty,
            selectedObjectIds,
            onQuickSave,
            onDeleteSelected,
            onHotkeyHintsVisibleChange,
        };
    }, [
        isDisabled,
        isSaving,
        isDirty,
        selectedObjectIds,
        onQuickSave,
        onDeleteSelected,
        onHotkeyHintsVisibleChange,
    ]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const latest = latestValuesRef.current;

            const isSaveHotkey =
                (event.ctrlKey || event.metaKey) && event.code === 'KeyS';

            if (isSaveHotkey) {
                stopBrowserHotkey(event);

                if (!latest.isDisabled && !latest.isSaving) {
                    void latest.onQuickSave();
                }

                return;
            }

            const isHintsHotkey =
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey &&
                event.code === 'KeyQ';

            if (isHintsHotkey) {
                if (!isTypingTarget(event.target)) {
                    event.preventDefault();
                    latest.onHotkeyHintsVisibleChange(true);
                }

                return;
            }

            if (latest.isDisabled) {
                return;
            }

            if (event.key === 'Delete') {
                if (isTypingTarget(event.target)) {
                    return;
                }

                if (latest.selectedObjectIds.length === 0) {
                    return;
                }

                event.preventDefault();
                latest.onDeleteSelected();
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.code === 'KeyQ') {
                latestValuesRef.current.onHotkeyHintsVisibleChange(false);
            }
        };

        const handleBlur = () => {
            latestValuesRef.current.onHotkeyHintsVisibleChange(false);
        };

        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);
}
