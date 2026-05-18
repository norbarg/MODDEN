import { useEffect, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import type {
    EditorTextFontWeight,
    EditorTextObject,
} from '../../model/editorTypes';
import { EditorColorPicker } from '../color-picker';

import minusIcon from '../../../../assets/editor-subheader/minus.svg';
import plusIcon from '../../../../assets/editor-subheader/plus2.svg';
import chevronDownIcon from '../../../../assets/editor-subheader/chevron-down.svg';

type EditorTextToolbarProps = {
    selectedTextObject: EditorTextObject;
    recentColors: string[];
    isDisabled: boolean;
    onTextChange: (changes: Partial<EditorTextObject>) => void;
    onTextColorChangeStart: () => void;
    onTextColorPreview: (color: string) => void;
    onTextColorCommit: (color: string) => void;
};

const FONT_FAMILIES = [
    'Inter',
    'Montserrat',
    'Poppins',
    'Roboto',
    'Playfair Display',
    'Merriweather',
    'Oswald',
    'Raleway',
    'Lora',
    'Bebas Neue',
    'Arial',
    'Georgia',
    'Times New Roman',
];
const FONT_WEIGHTS: EditorTextFontWeight[] = ['400', '500', '700'];

function getFontWeightLabel(weight: EditorTextFontWeight) {
    if (weight === '400') {
        return 'Regular';
    }

    if (weight === '500') {
        return 'Medium';
    }

    return 'Bold';
}

export function EditorTextToolbar({
    selectedTextObject,
    recentColors,
    isDisabled,
    onTextChange,
    onTextColorChangeStart,
    onTextColorPreview,
    onTextColorCommit,
}: EditorTextToolbarProps) {
    const [isFontFamilyOpen, setIsFontFamilyOpen] = useState(false);
    const [isFontWeightOpen, setIsFontWeightOpen] = useState(false);
    const handleFontSizeChange = (delta: number) => {
        onTextChange({
            fontSize: Math.max(8, selectedTextObject.fontSize + delta),
        });
    };

    const commitFontSize = () => {
        const nextFontSize = Number(draftFontSize);

        if (!Number.isFinite(nextFontSize)) {
            setDraftFontSize(String(Math.round(selectedTextObject.fontSize)));
            return;
        }

        const normalizedFontSize = Math.max(8, Math.min(300, nextFontSize));

        setDraftFontSize(String(Math.round(normalizedFontSize)));

        if (normalizedFontSize === selectedTextObject.fontSize) {
            return;
        }

        onTextChange({
            fontSize: normalizedFontSize,
        });
    };

    const handleFontSizeKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.currentTarget.blur();
        }

        if (event.key === 'Escape') {
            setDraftFontSize(String(Math.round(selectedTextObject.fontSize)));
            event.currentTarget.blur();
        }
    };

    const [draftFontSize, setDraftFontSize] = useState(
        String(Math.round(selectedTextObject.fontSize)),
    );

    useEffect(() => {
        setDraftFontSize(String(Math.round(selectedTextObject.fontSize)));
    }, [selectedTextObject.id, selectedTextObject.fontSize]);

    return (
        <>
            <div
                className={`editor-subheader__dropdown editor-subheader__dropdown--font ${
                    isFontFamilyOpen ? 'editor-subheader__dropdown--open' : ''
                }`}
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                        setIsFontFamilyOpen(false);
                    }
                }}
            >
                <button
                    className="editor-subheader__dropdown-button"
                    type="button"
                    disabled={isDisabled}
                    aria-haspopup="listbox"
                    aria-expanded={isFontFamilyOpen}
                    onClick={() => setIsFontFamilyOpen((isOpen) => !isOpen)}
                >
                    <span>{selectedTextObject.fontFamily}</span>

                    <img
                        className="editor-subheader__dropdown-arrow"
                        src={chevronDownIcon}
                        alt=""
                        aria-hidden="true"
                    />
                </button>

                {isFontFamilyOpen && (
                    <div
                        className="editor-subheader__dropdown-menu editor-subheader__dropdown-menu--font"
                        role="listbox"
                    >
                        {FONT_FAMILIES.map((fontFamily) => {
                            const isSelected =
                                fontFamily === selectedTextObject.fontFamily;

                            return (
                                <button
                                    key={fontFamily}
                                    className={`editor-subheader__dropdown-option ${
                                        isSelected
                                            ? 'editor-subheader__dropdown-option--active'
                                            : ''
                                    }`}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => {
                                        onTextChange({ fontFamily });
                                        setIsFontFamilyOpen(false);
                                    }}
                                >
                                    <span>{fontFamily}</span>

                                    {isSelected && (
                                        <span
                                            className="editor-subheader__dropdown-check"
                                            aria-hidden="true"
                                        >
                                            ●
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <span className="editor-subheader__divider" />
            <div
                className={`editor-subheader__dropdown editor-subheader__dropdown--weight ${
                    isFontWeightOpen ? 'editor-subheader__dropdown--open' : ''
                }`}
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                        setIsFontWeightOpen(false);
                    }
                }}
            >
                <button
                    className="editor-subheader__dropdown-button"
                    type="button"
                    disabled={isDisabled}
                    aria-haspopup="listbox"
                    aria-expanded={isFontWeightOpen}
                    onClick={() => setIsFontWeightOpen((isOpen) => !isOpen)}
                >
                    <span>
                        {getFontWeightLabel(selectedTextObject.fontWeight)}
                    </span>

                    <img
                        className="editor-subheader__dropdown-arrow"
                        src={chevronDownIcon}
                        alt=""
                        aria-hidden="true"
                    />
                </button>

                {isFontWeightOpen && (
                    <div
                        className="editor-subheader__dropdown-menu editor-subheader__dropdown-menu--weight"
                        role="listbox"
                    >
                        {FONT_WEIGHTS.map((fontWeight) => {
                            const isSelected =
                                fontWeight === selectedTextObject.fontWeight;

                            return (
                                <button
                                    key={fontWeight}
                                    className={`editor-subheader__dropdown-option ${
                                        isSelected
                                            ? 'editor-subheader__dropdown-option--active'
                                            : ''
                                    }`}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => {
                                        onTextChange({ fontWeight });
                                        setIsFontWeightOpen(false);
                                    }}
                                >
                                    <span>
                                        {getFontWeightLabel(fontWeight)}
                                    </span>

                                    {isSelected && (
                                        <span
                                            className="editor-subheader__dropdown-check"
                                            aria-hidden="true"
                                        >
                                            ●
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="editor-subheader__text-size">
                <button
                    className="editor-subheader__text-size-button"
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleFontSizeChange(-1)}
                    aria-label="Decrease font size"
                >
                    <img src={minusIcon} alt="" aria-hidden="true" />
                </button>

                <input
                    className="editor-subheader__text-size-input"
                    type="number"
                    min={8}
                    max={300}
                    step={1}
                    value={draftFontSize}
                    disabled={isDisabled}
                    aria-label="Font size"
                    onChange={(event) => setDraftFontSize(event.target.value)}
                    onBlur={commitFontSize}
                    onKeyDown={handleFontSizeKeyDown}
                />

                <button
                    className="editor-subheader__text-size-button"
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleFontSizeChange(1)}
                    aria-label="Increase font size"
                >
                    <img src={plusIcon} alt="" aria-hidden="true" />
                </button>
            </div>

            {isDisabled ? (
                <button
                    className="editor-subheader__color editor-subheader__color--disabled"
                    type="button"
                    disabled
                >
                    <span
                        style={
                            {
                                '--current-color': selectedTextObject.color,
                            } as CSSProperties
                        }
                    />
                </button>
            ) : (
                <EditorColorPicker
                    value={selectedTextObject.color}
                    recentColors={recentColors}
                    triggerClassName="editor-subheader__color"
                    onChangeStart={onTextColorChangeStart}
                    onPreview={onTextColorPreview}
                    onCommit={onTextColorCommit}
                >
                    <span
                        style={
                            {
                                '--current-color': selectedTextObject.color,
                            } as CSSProperties
                        }
                    />
                </EditorColorPicker>
            )}
        </>
    );
}
