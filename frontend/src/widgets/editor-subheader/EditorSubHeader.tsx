// src/widgets/editor-subheader/EditorSubHeader.tsx
import type { CSSProperties } from 'react';
import type {
    EditorImageFilterValues,
    EditorScene,
    EditorSceneObject,
} from '../../features/editor/model/editorTypes';
import { EditorImageFilters } from '../../features/editor/ui/image-filters';
import type { EditorTextObject } from '../../features/editor/model/editorTypes';
import { EditorTextToolbar } from '../../features/editor/ui/text-toolbar';
import { EditorColorPicker } from '../../features/editor/ui/color-picker';
import './EditorSubHeader.css';

import duplicateIcon from '../../assets/editor-subheader/duplicate.svg';
import lockIcon from '../../assets/editor-subheader/lock.svg';
import deleteIcon from '../../assets/editor-subheader/delete.svg';
import lockClosedIcon from '../../assets/editor-subheader/lock-closed.svg';

type EditorSubHeaderProps = {
    scene: EditorScene;
    selectedObject: EditorSceneObject | null;
    recentCanvasColors: string[];
    onCanvasBackgroundChangeStart: () => void;
    onCanvasBackgroundPreview: (color: string) => void;
    onCanvasBackgroundCommit: (color: string) => void;
    onSelectedObjectColorChangeStart: () => void;
    onSelectedObjectColorPreview: (color: string) => void;
    onSelectedObjectColorCommit: (color: string) => void;
    onSelectedImageFiltersChange: (filters: EditorImageFilterValues) => void;
    onSelectedObjectDuplicate: () => void;
    onSelectedObjectLockToggle: () => void;
    onSelectedObjectDelete: () => void;
    selectedObjects: EditorSceneObject[];
    onSelectedTextChange: (changes: Partial<EditorTextObject>) => void;
    onSelectedTextColorChangeStart: () => void;
    onSelectedTextColorPreview: (color: string) => void;
    onSelectedTextColorCommit: (color: string) => void;
};

export function EditorSubHeader({
    scene,
    recentCanvasColors,
    onCanvasBackgroundChangeStart,
    onCanvasBackgroundPreview,
    onCanvasBackgroundCommit,
    onSelectedObjectColorChangeStart,
    onSelectedObjectColorPreview,
    onSelectedObjectColorCommit,
    onSelectedImageFiltersChange,
    onSelectedObjectDuplicate,
    onSelectedObjectLockToggle,
    onSelectedObjectDelete,
    selectedObjects,
    onSelectedTextChange,
    onSelectedTextColorChangeStart,
    onSelectedTextColorPreview,
    onSelectedTextColorCommit,
}: EditorSubHeaderProps) {
    const hasSelectedObjects = selectedObjects.length > 0;

    const firstSelectedObject = selectedObjects[0] ?? null;

    const selectedImageObject =
        selectedObjects.length === 1 && firstSelectedObject?.type === 'image'
            ? firstSelectedObject
            : null;

    if (!hasSelectedObjects) {
        return (
            <div
                className="editor-subheader editor-subheader--canvas"
                aria-label="Canvas background toolbar"
            >
                <EditorColorPicker
                    value={scene.background.color}
                    recentColors={recentCanvasColors}
                    triggerClassName="editor-subheader__canvas-color"
                    onChangeStart={onCanvasBackgroundChangeStart}
                    onPreview={onCanvasBackgroundPreview}
                    onCommit={onCanvasBackgroundCommit}
                >
                    <span
                        style={
                            {
                                '--canvas-color': scene.background.color,
                            } as CSSProperties
                        }
                    />
                </EditorColorPicker>
            </div>
        );
    }

    const areAllSelectedObjectsLocked = selectedObjects.every(
        (object) => object.locked,
    );

    const selectedTextObject =
        selectedObjects.length === 1 && firstSelectedObject?.type === 'text'
            ? firstSelectedObject
            : null;

    const isSingleTextSelected = Boolean(selectedTextObject);

    const selectedColorObjects = selectedObjects.filter(
        (object) =>
            object.type === 'shape' ||
            object.type === 'draw' ||
            object.type === 'text',
    );

    const canChangeColor =
        selectedColorObjects.length > 0 &&
        selectedColorObjects.length === selectedObjects.length &&
        !isSingleTextSelected;

    const currentColor = canChangeColor
        ? selectedColorObjects[0].color
        : '#ffffff';

    const isSingleImageSelected = Boolean(selectedImageObject);

    return (
        <div
            className="editor-subheader editor-subheader--object"
            aria-label="Object toolbar"
        >
            {canChangeColor ? (
                areAllSelectedObjectsLocked ? (
                    <button
                        className="editor-subheader__color editor-subheader__color--disabled"
                        type="button"
                        aria-label="Object color is locked"
                        disabled
                    >
                        <span
                            style={
                                {
                                    '--current-color': currentColor,
                                } as CSSProperties
                            }
                        />
                    </button>
                ) : (
                    <EditorColorPicker
                        key={`selected-objects-color-${selectedObjects
                            .map((object) => object.id)
                            .join('-')}`}
                        value={currentColor}
                        recentColors={recentCanvasColors}
                        triggerClassName="editor-subheader__color"
                        onChangeStart={onSelectedObjectColorChangeStart}
                        onPreview={onSelectedObjectColorPreview}
                        onCommit={onSelectedObjectColorCommit}
                    >
                        <span
                            style={
                                {
                                    '--current-color': currentColor,
                                } as CSSProperties
                            }
                        />
                    </EditorColorPicker>
                )
            ) : isSingleImageSelected ? (
                <EditorImageFilters
                    selectedObject={selectedImageObject}
                    isDisabled={areAllSelectedObjectsLocked}
                    onFiltersChange={onSelectedImageFiltersChange}
                />
            ) : isSingleTextSelected && selectedTextObject ? (
                <EditorTextToolbar
                    selectedTextObject={selectedTextObject}
                    recentColors={recentCanvasColors}
                    isDisabled={areAllSelectedObjectsLocked}
                    onTextChange={onSelectedTextChange}
                    onTextColorChangeStart={onSelectedTextColorChangeStart}
                    onTextColorPreview={onSelectedTextColorPreview}
                    onTextColorCommit={onSelectedTextColorCommit}
                />
            ) : null}

            <span className="editor-subheader__divider" />

            <button
                className="editor-subheader__button"
                type="button"
                aria-label="Duplicate"
                onClick={onSelectedObjectDuplicate}
            >
                <img src={duplicateIcon} alt="" aria-hidden="true" />
            </button>

            <span className="editor-subheader__divider" />

            <button
                className="editor-subheader__button"
                type="button"
                aria-label={
                    areAllSelectedObjectsLocked
                        ? 'Unlock selected objects'
                        : 'Lock selected objects'
                }
                onClick={onSelectedObjectLockToggle}
            >
                <img
                    src={
                        areAllSelectedObjectsLocked ? lockClosedIcon : lockIcon
                    }
                    alt=""
                    aria-hidden="true"
                />
            </button>

            <button
                className="editor-subheader__button"
                type="button"
                aria-label="Delete"
                onClick={onSelectedObjectDelete}
                disabled={areAllSelectedObjectsLocked}
            >
                <img src={deleteIcon} alt="" aria-hidden="true" />
            </button>
        </div>
    );
}
