// src/widgets/editor-header/EditorHeader.tsx
import type { WorkspaceProject } from '../../shared/types/workspace';
import './EditorHeader.css';

import undoIcon from '../../assets/editor-header/undo.svg';
import redoIcon from '../../assets/editor-header/redo.svg';
import shareIcon from '../../assets/editor-header/share.svg';
import downloadIcon from '../../assets/editor-header/download.svg';
import savedIcon from '../../assets/editor-header/saved.svg';

type EditorHeaderProps = {
    project: WorkspaceProject;
    isDirty: boolean;
    isSaving: boolean;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onOpenProjectSettings: () => void;
    onOpenSaveProject: () => void;
};

export function EditorHeader({
    project,
    isDirty,
    isSaving,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onOpenProjectSettings,
    onOpenSaveProject,
}: EditorHeaderProps) {
    return (
        <header className="editor-header">
            <div className="editor-header__left">
                <button
                    className="editor-header__meta-button editor-header__size"
                    type="button"
                    onClick={onOpenProjectSettings}
                >
                    {project.canvasWidth} × {project.canvasHeight}
                </button>

                <span className="editor-header__divider" />

                <button
                    className="editor-header__meta-button editor-header__title"
                    type="button"
                    onClick={onOpenProjectSettings}
                >
                    {project.title}
                </button>
            </div>

            <div className="editor-header__right">
                <div className="unredo">
                    <button
                        className="editor-header__icon-button"
                        type="button"
                        aria-label="Undo"
                        disabled={!canUndo}
                        onClick={onUndo}
                    >
                        <img src={undoIcon} alt="" aria-hidden="true" />
                    </button>

                    <button
                        className="editor-header__icon-button"
                        type="button"
                        aria-label="Redo"
                        disabled={!canRedo}
                        onClick={onRedo}
                    >
                        <img src={redoIcon} alt="" aria-hidden="true" />
                    </button>
                </div>

                <span className="editor-header__divider" />

                <button
                    className={`editor-header__save ${
                        !isDirty ? 'editor-header__save--saved' : ''
                    }`}
                    type="button"
                    disabled={isSaving || !isDirty}
                    onClick={onOpenSaveProject}
                >
                    {!isDirty && (
                        <img src={savedIcon} alt="" aria-hidden="true" />
                    )}

                    {isSaving ? 'Saving...' : isDirty ? 'Save' : 'Saved'}
                </button>

                <button className="editor-header__share" type="button">
                    <img src={shareIcon} alt="" aria-hidden="true" />
                    Share
                </button>

                <span className="editor-header__divider" />

                <button className="editor-header__download" type="button">
                    <img src={downloadIcon} alt="" aria-hidden="true" />
                    Download
                </button>
            </div>
        </header>
    );
}
