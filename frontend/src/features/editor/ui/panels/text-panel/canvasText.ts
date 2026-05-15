import type {
    EditorTextFontWeight,
    EditorTextObject,
} from '../../../model/editorTypes';

export type EditorTextPreset = 'heading' | 'paragraph' | 'small-text';

type TextPresetSettings = {
    fontSize: number;
    fontWeight: EditorTextFontWeight;
    width: number;
    height: number;
};

const TEXT_PRESETS: Record<EditorTextPreset, TextPresetSettings> = {
    heading: {
        fontSize: 54,
        fontWeight: '700',
        width: 360,
        height: 80,
    },
    paragraph: {
        fontSize: 30,
        fontWeight: '500',
        width: 280,
        height: 52,
    },
    'small-text': {
        fontSize: 18,
        fontWeight: '400',
        width: 180,
        height: 34,
    },
};

function createTextObjectId() {
    return `text_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

type CreateTextObjectParams = {
    preset?: EditorTextPreset;
    canvasWidth: number;
    canvasHeight: number;
};

export function createTextObject({
    preset = 'paragraph',
    canvasWidth,
    canvasHeight,
}: CreateTextObjectParams): EditorTextObject {
    const settings = TEXT_PRESETS[preset];

    return {
        id: createTextObjectId(),
        type: 'text',
        text: 'Text',

        x: canvasWidth / 2 - settings.width / 2,
        y: canvasHeight / 2 - settings.height / 2,
        width: settings.width,
        height: settings.height,
        rotation: 0,

        fontFamily: 'Inter',
        fontWeight: settings.fontWeight,
        fontSize: settings.fontSize,
        color: '#000000',
    };
}
