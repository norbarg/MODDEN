import type { CSSProperties } from 'react';
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
    const handleFontSizeChange = (delta: number) => {
        onTextChange({
            fontSize: Math.max(8, selectedTextObject.fontSize + delta),
        });
    };

    return (
        <>
            <div className="editor-subheader__select-wrap editor-subheader__select-wrap--font">
                <select
                    className="editor-subheader__select"
                    value={selectedTextObject.fontFamily}
                    disabled={isDisabled}
                    onChange={(event) =>
                        onTextChange({
                            fontFamily: event.target.value,
                        })
                    }
                >
                    {FONT_FAMILIES.map((fontFamily) => (
                        <option key={fontFamily} value={fontFamily}>
                            {fontFamily}
                        </option>
                    ))}
                </select>

                <img
                    className="editor-subheader__select-arrow"
                    src={chevronDownIcon}
                    alt=""
                    aria-hidden="true"
                />
            </div>

            <span className="editor-subheader__divider" />

            <div className="editor-subheader__select-wrap editor-subheader__select-wrap--weight">
                <select
                    className="editor-subheader__select"
                    value={selectedTextObject.fontWeight}
                    disabled={isDisabled}
                    onChange={(event) =>
                        onTextChange({
                            fontWeight: event.target
                                .value as EditorTextFontWeight,
                        })
                    }
                >
                    {FONT_WEIGHTS.map((fontWeight) => (
                        <option key={fontWeight} value={fontWeight}>
                            {getFontWeightLabel(fontWeight)}
                        </option>
                    ))}
                </select>

                <img
                    className="editor-subheader__select-arrow"
                    src={chevronDownIcon}
                    alt=""
                    aria-hidden="true"
                />
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

                <strong>{Math.round(selectedTextObject.fontSize)}</strong>

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
