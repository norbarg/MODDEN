// src/widgets/editor-subheader/EditorSubHeader.tsx
import type { CSSProperties } from 'react';
import type {
    EditorScene,
    EditorSceneObject,
} from '../../features/editor/model/editorTypes';
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
    onSelectedObjectDuplicate: () => void;
    onSelectedObjectLockToggle: () => void;
    onSelectedObjectDelete: () => void;
};

export function EditorSubHeader({
    scene,
    selectedObject,
    recentCanvasColors,
    onCanvasBackgroundChangeStart,
    onCanvasBackgroundPreview,
    onCanvasBackgroundCommit,
    onSelectedObjectColorChangeStart,
    onSelectedObjectColorPreview,
    onSelectedObjectColorCommit,
    onSelectedObjectDuplicate,
    onSelectedObjectLockToggle,
    onSelectedObjectDelete,
}: EditorSubHeaderProps) {
    if (!selectedObject) {
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

    const currentColor =
        selectedObject.type === 'draw' ? selectedObject.color : '#5ed99a';

    const isSelectedObjectLocked = Boolean(selectedObject.locked);

    return (
        <div
            className="editor-subheader editor-subheader--object"
            aria-label="Object toolbar"
        >
            {isSelectedObjectLocked ? (
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
            )}

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
                aria-label={isSelectedObjectLocked ? 'Unlock' : 'Lock'}
                onClick={onSelectedObjectLockToggle}
            >
                <img
                    src={isSelectedObjectLocked ? lockClosedIcon : lockIcon}
                    alt=""
                    aria-hidden="true"
                />
            </button>

            <button
                className="editor-subheader__button"
                type="button"
                aria-label="Delete"
                onClick={onSelectedObjectDelete}
                disabled={isSelectedObjectLocked}
            >
                <img src={deleteIcon} alt="" aria-hidden="true" />
            </button>
        </div>
    );
}
