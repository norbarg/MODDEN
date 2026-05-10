// src/widgets/editor-subheader/EditorSubHeader.tsx
import type { CSSProperties } from 'react';
import type {
    EditorOption,
    EditorScene,
} from '../../features/editor/model/editorTypes';
import { EditorColorPicker } from '../../features/editor/ui/color-picker';
import './EditorSubHeader.css';

import duplicateIcon from '../../assets/editor-subheader/duplicate.svg';
import lockIcon from '../../assets/editor-subheader/lock.svg';
import deleteIcon from '../../assets/editor-subheader/delete.svg';

type EditorSubHeaderProps = {
    scene: EditorScene;
    activeOption: EditorOption;
    recentCanvasColors: string[];
    onCanvasBackgroundChangeStart: () => void;
    onCanvasBackgroundPreview: (color: string) => void;
    onCanvasBackgroundCommit: (color: string) => void;
};
const OPTION_COLOR: Record<string, string> = {
    pencil: '#5ed99a',
    marker: '#ff7a59',
    eraser: '#708d96',
    rectangle: '#7aa5ff',
    circle: '#7aa5ff',
    line: '#7aa5ff',
    heading: '#ff7a59',
    paragraph: '#ff7a59',
    image: '#f05c8d',
    upload: '#c89cff',
};

export function EditorSubHeader({
    scene,
    activeOption,
    recentCanvasColors,
    onCanvasBackgroundChangeStart,
    onCanvasBackgroundPreview,
    onCanvasBackgroundCommit,
}: EditorSubHeaderProps) {
    if (!activeOption) {
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

    const currentColor = OPTION_COLOR[activeOption.id] ?? '#5ed99a';

    return (
        <div className="editor-subheader" aria-label="Context toolbar">
            <button
                className="editor-subheader__color"
                type="button"
                aria-label="Change color"
                style={
                    {
                        '--current-color': currentColor,
                    } as CSSProperties
                }
            />

            <span className="editor-subheader__divider" />

            <button
                className="editor-subheader__button"
                type="button"
                aria-label="Duplicate"
            >
                <img src={duplicateIcon} alt="" aria-hidden="true" />
            </button>

            <span className="editor-subheader__divider" />

            <button
                className="editor-subheader__button"
                type="button"
                aria-label="Lock"
            >
                <img src={lockIcon} alt="" aria-hidden="true" />
            </button>

            <button
                className="editor-subheader__button"
                type="button"
                aria-label="Delete"
            >
                <img src={deleteIcon} alt="" aria-hidden="true" />
            </button>
        </div>
    );
}
