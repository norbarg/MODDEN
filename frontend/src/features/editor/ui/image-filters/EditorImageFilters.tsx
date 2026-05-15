import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type {
    EditorImageFilterValues,
    EditorSceneObject,
} from '../../model/editorTypes';

import filtersIcon from '../../../../assets/editor-subheader/filters.svg';

type EditorImageFiltersProps = {
    selectedObject: EditorSceneObject | null;
    isDisabled?: boolean;
    onFiltersChange: (filters: EditorImageFilterValues) => void;
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

export function EditorImageFilters({
    selectedObject,
    isDisabled = false,
    onFiltersChange,
}: EditorImageFiltersProps) {
    const [isFiltersPopupOpen, setIsFiltersPopupOpen] = useState(false);

    const [draftImageFilters, setDraftImageFilters] =
        useState<EditorImageFilterValues>(DEFAULT_IMAGE_FILTERS);

    const selectedImageObject =
        selectedObject?.type === 'image' ? selectedObject : null;

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

    useEffect(() => {
        setIsFiltersPopupOpen(false);
    }, [selectedImageObject?.id]);

    if (!selectedImageObject) {
        return null;
    }

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
        onFiltersChange(draftImageFilters);
    };

    const handleResetFilters = () => {
        setDraftImageFilters(DEFAULT_IMAGE_FILTERS);
        onFiltersChange(DEFAULT_IMAGE_FILTERS);
    };

    return (
        <div className="editor-subheader__filters">
            <button
                className={`editor-subheader__button ${
                    isFiltersPopupOpen ? 'editor-subheader__button--active' : ''
                }`}
                type="button"
                aria-label="Image filters"
                disabled={isDisabled}
                onClick={() => setIsFiltersPopupOpen((isOpen) => !isOpen)}
            >
                <img src={filtersIcon} alt="" aria-hidden="true" />
            </button>

            {isFiltersPopupOpen && !isDisabled ? (
                <div className="editor-subheader__filters-popup">
                    {FILTER_CONTROLS.map((control) => {
                        const currentValue = draftImageFilters[control.id];

                        const rangeValue = control.valueToRange(currentValue);

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
                                                Number(event.target.value),
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
            ) : null}
        </div>
    );
}
