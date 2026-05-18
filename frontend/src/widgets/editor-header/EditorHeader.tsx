// src/widgets/editor-header/EditorHeader.tsx

import { useEffect, useRef, useState } from 'react';
import type { WorkspaceProject } from '../../shared/types/workspace';
import type { EditorExportFormat } from '../../features/editor/export/exportEditorScene';
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
    isExporting: boolean;
    onDownloadProject: (format: EditorExportFormat) => Promise<void>;
};

export function EditorHeader({
    project,
    isDirty,
    isSaving,
    isExporting,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onOpenProjectSettings,
    onOpenSaveProject,
    onDownloadProject,
}: EditorHeaderProps) {
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const [isPngMenuOpen, setIsPngMenuOpen] = useState(false);
const downloadRef = useRef<HTMLDivElement | null>(null);

const downloadOptions: Array<
    | {
          type: 'format';
          label: string;
          description: string;
          format: EditorExportFormat;
      }
    | {
          type: 'png-group';
          label: string;
          description: string;
      }
> = [
    {
        type: 'png-group',
        label: 'PNG',
        description: 'High quality image',
    },
    {
        type: 'format',
        label: 'JPG',
        description: 'Smaller image file',
        format: 'jpg',
    },
    {
        type: 'format',
        label: 'PDF',
        description: 'Document for sharing',
        format: 'pdf',
    },
    {
        type: 'format',
        label: 'WebP',
        description: 'Optimized for web',
        format: 'webp',
    },
];

useEffect(() => {
    if (!isDownloadOpen) {
        return;
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (
            downloadRef.current &&
            !downloadRef.current.contains(event.target as Node)
        ) {
            setIsDownloadOpen(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
}, [isDownloadOpen]);

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
                <div
    className={`editor-header__download-wrap ${
        isDownloadOpen ? 'editor-header__download-wrap--open' : ''
    }`}
    ref={downloadRef}
>
    <button
        className="editor-header__download"
        type="button"
        disabled={isExporting}
        onClick={() => setIsDownloadOpen((current) => !current)}
    >
        <img src={downloadIcon} alt="" aria-hidden="true" />
        {isExporting ? 'Exporting...' : 'Download'}
    </button>

    {isDownloadOpen && (
        // <div className="editor-header__download-menu">
        //     {downloadOptions.map((option) => {
        <div className="editor-header__download-menu">
    <div className="editor-header__download-menu-head">
        <strong>Download design</strong>
        <small>Choose the best export format</small>
    </div>

    {downloadOptions.map((option) => {
    if (option.type === 'png-group') {
        return (
            <div
                className="editor-header__download-option-wrap"
                key="png"
                onMouseEnter={() => setIsPngMenuOpen(true)}
                onMouseLeave={() => setIsPngMenuOpen(false)}
            >
                <button
                    className="editor-header__download-option"
                    type="button"
                    disabled={isExporting}
                    onClick={() =>
                        setIsPngMenuOpen((currentValue) => !currentValue)
                    }
                    
                >
                    <span className="editor-header__download-option-text">
    <strong>{option.label}</strong>
    <small>{option.description}</small>
</span>

<span className="editor-header__download-option-arrow">
    ›
</span>
                </button>

                {isPngMenuOpen && (
                    <div className="editor-header__download-submenu">
                        <div className="editor-header__download-menu-head editor-header__download-menu-head--small">
    <strong>PNG options</strong>
    <small>Select background mode</small>
</div>
<button
    className="editor-header__download-option editor-header__download-option--large"
    type="button"
    disabled={isExporting}
    onClick={async () => {
        setIsDownloadOpen(false);
        setIsPngMenuOpen(false);
        await onDownloadProject('png');
    }}
>
    <span className="editor-header__download-option-text">
        <strong>With background</strong>
        <small>Use current canvas color</small>
    </span>
</button>

                        <button
                            className="editor-header__download-option"
                            type="button"
                            disabled={isExporting}
                            onClick={async () => {
                                setIsDownloadOpen(false);
                                setIsPngMenuOpen(false);
                                await onDownloadProject('png-transparent');
                            }}
                        >
                            <span className="editor-header__download-option-text">
    <strong>Transparent</strong>
    <small>No background color</small>
</span>
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <button
            className="editor-header__download-option"
            type="button"
            key={option.format}
            disabled={isExporting}
            onClick={async () => {
                setIsDownloadOpen(false);
                await onDownloadProject(option.format);
            }}
        >
            <span className="editor-header__download-option-text">
    <strong>{option.label}</strong>
    <small>{option.description}</small>
</span>
        </button>
    );
})}
<div className="editor-header__download-menu-note">
    Files are saved directly to your device
</div>
        </div>
    )}
</div>
            </div>
        </header>
    );
}
