// src/widgets/editor-subheader/EditorSubHeader.tsx
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type {
    EditorImageFilterValues,
    EditorScene,
    EditorSceneObject,
} from '../../features/editor/model/editorTypes';
import { EditorColorPicker } from '../../features/editor/ui/color-picker';
import './EditorSubHeader.css';

import duplicateIcon from '../../assets/editor-subheader/duplicate.svg';
import lockIcon from '../../assets/editor-subheader/lock.svg';
import deleteIcon from '../../assets/editor-subheader/delete.svg';
import lockClosedIcon from '../../assets/editor-subheader/lock-closed.svg';
import filtersIcon from '../../assets/editor-subheader/filters.svg';

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
};

type FilterControl = {
    id: keyof EditorImageFilterValues;
    label: string;
    min: number;
    max: number;
    step: number;
    valueToRange: (value: number) => number;
    rangeToValue: (value: number) => number;
};

const FILTER_CONTROLS: FilterControl[] = [
    {
        id: 'brightness',
        label: 'Brightness',
        min: -100,
        max: 100,
        step: 1,
        valueToRange: (value) => Math.round(value * 100),
        rangeToValue: (value) => value / 100,
    },
    {
        id: 'contrast',
        label: 'Contrast',
        min: -100,
        max: 100,
        step: 1,
        valueToRange: (value) => Math.round(value * 100),
        rangeToValue: (value) => value / 100,
    },
    {
        id: 'saturation',
        label: 'Saturation',
        min: -100,
        max: 100,
        step: 1,
        valueToRange: (value) => Math.round(value * 100),
        rangeToValue: (value) => value / 100,
    },
    {
        id: 'grayscale',
        label: 'Grayscale',
        min: 0,
        max: 100,
        step: 1,
        valueToRange: (value) => Math.round(value * 100),
        rangeToValue: (value) => value / 100,
    },
    {
        id: 'sepia',
        label: 'Sepia',
        min: 0,
        max: 100,
        step: 1,
        valueToRange: (value) => Math.round(value * 100),
        rangeToValue: (value) => value / 100,
    },
    {
        id: 'blur',
        label: 'Blur',
        min: 0,
        max: 100,
        step: 1,
        valueToRange: (value) => Math.round(value * 100),
        rangeToValue: (value) => value / 100,
    },
    {
        id: 'invert',
        label: 'Invert',
        min: 0,
        max: 100,
        step: 1,
        valueToRange: (value) => Math.round(value * 100),
        rangeToValue: (value) => value / 100,
    },
];

const DEFAULT_IMAGE_FILTERS: EditorImageFilterValues = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    grayscale: 0,
    sepia: 0,
    blur: 0,
    invert: 0,
};

function normalizeImageFilters(
    filters: Partial<EditorImageFilterValues> | undefined,
): EditorImageFilterValues {
    return {
        ...DEFAULT_IMAGE_FILTERS,
        ...filters,
    };
}

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
}: EditorSubHeaderProps) {
    const [isFiltersPopupOpen, setIsFiltersPopupOpen] = useState(false);

    const [draftImageFilters, setDraftImageFilters] =
        useState<EditorImageFilterValues>(DEFAULT_IMAGE_FILTERS);

    const hasSelectedObjects = selectedObjects.length > 0;

    const firstSelectedObject = selectedObjects[0] ?? null;

    const selectedImageObject =
        selectedObjects.length === 1 && firstSelectedObject?.type === 'image'
            ? firstSelectedObject
            : null;

    const currentImageFilters = selectedImageObject
        ? normalizeImageFilters(selectedImageObject.filters)
        : DEFAULT_IMAGE_FILTERS;

    useEffect(() => {
        setDraftImageFilters(currentImageFilters);
    }, [
        selectedImageObject?.id,
        currentImageFilters.brightness,
        currentImageFilters.contrast,
        currentImageFilters.saturation,
        currentImageFilters.grayscale,
        currentImageFilters.sepia,
        currentImageFilters.blur,
        currentImageFilters.invert,
    ]);

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

    const selectedColorObjects = selectedObjects.filter(
        (object) => object.type === 'shape' || object.type === 'draw',
    );

    const canChangeColor =
        selectedColorObjects.length > 0 &&
        selectedColorObjects.length === selectedObjects.length;

    const currentColor = canChangeColor
        ? selectedColorObjects[0].color
        : '#ffffff';

    const isSingleImageSelected = Boolean(selectedImageObject);

    const handleFilterDraftChange = (
        filterId: keyof EditorImageFilterValues,
        value: number,
    ) => {
        setDraftImageFilters((currentFilters) => ({
            ...currentFilters,
            [filterId]: value,
        }));
    };

    const handleFiltersCommit = () => {
        if (!selectedImageObject) {
            return;
        }

        onSelectedImageFiltersChange(draftImageFilters);
    };

    const handleResetFilters = () => {
        if (!selectedImageObject) {
            return;
        }

        setDraftImageFilters(DEFAULT_IMAGE_FILTERS);
        onSelectedImageFiltersChange(DEFAULT_IMAGE_FILTERS);
    };

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
                <div className="editor-subheader__filters">
                    <button
                        className={`editor-subheader__button ${
                            isFiltersPopupOpen
                                ? 'editor-subheader__button--active'
                                : ''
                        }`}
                        type="button"
                        aria-label="Image filters"
                        disabled={areAllSelectedObjectsLocked}
                        onClick={() =>
                            setIsFiltersPopupOpen((isOpen) => !isOpen)
                        }
                    >
                        <img src={filtersIcon} alt="" aria-hidden="true" />
                    </button>

                    {isFiltersPopupOpen && (
                        <div className="editor-subheader__filters-popup">
                            {FILTER_CONTROLS.map((control) => {
                                const currentValue =
                                    draftImageFilters[control.id];

                                const rangeValue =
                                    control.valueToRange(currentValue);

                                const progress =
                                    ((rangeValue - control.min) /
                                        (control.max - control.min)) *
                                    100;

                                return (
                                    <label
                                        key={control.id}
                                        className="editor-subheader__filter-row"
                                    >
                                        <span>{control.label}</span>

                                        <input
                                            type="range"
                                            min={control.min}
                                            max={control.max}
                                            step={control.step}
                                            value={rangeValue}
                                            style={
                                                {
                                                    '--filter-progress': `${progress}%`,
                                                } as CSSProperties
                                            }
                                            onChange={(event) => {
                                                handleFilterDraftChange(
                                                    control.id,
                                                    control.rangeToValue(
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    ),
                                                );
                                            }}
                                            onMouseUp={handleFiltersCommit}
                                            onTouchEnd={handleFiltersCommit}
                                            onKeyUp={handleFiltersCommit}
                                        />
                                    </label>
                                );
                            })}

                            <button
                                className="editor-subheader__filters-reset"
                                type="button"
                                onClick={handleResetFilters}
                            >
                                Reset filters
                            </button>
                        </div>
                    )}
                </div>
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
