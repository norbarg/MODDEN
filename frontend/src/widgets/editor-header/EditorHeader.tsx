// src/widgets/editor-header/EditorHeader.tsx
import { ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';
import type { WorkspaceProject } from '../../shared/types/workspace';
import './EditorHeader.css';

type EditorHeaderProps = {
    project: WorkspaceProject;
};

export function EditorHeader({ project }: EditorHeaderProps) {
    return (
        <header className="editor-header">
            <div className="editor-header__left">
                <span className="editor-header__size">
                    {project.canvasWidth} × {project.canvasHeight}
                </span>

                <span className="editor-header__divider" />

                <strong>{project.title}</strong>
            </div>

            <div className="editor-header__right">
                <button className="editor-header__icon-button" type="button">
                    <ChevronLeft size={22} />
                </button>

                <button className="editor-header__icon-button" type="button">
                    <ChevronRight size={22} />
                </button>

                <span className="editor-header__divider" />

                <button className="editor-header__save" type="button" disabled>
                    Save
                </button>

                <button className="editor-header__share" type="button">
                    <Share2 size={16} />
                    Share
                </button>

                <span className="editor-header__divider" />

                <button className="editor-header__download" type="button">
                    <Download size={16} />
                    Download
                </button>
            </div>
        </header>
    );
}
