// src/widgets/editor-subheader/EditorSubHeader.tsx
import type { EditorPanel } from '../../features/editor/model/editorTypes';
import './EditorSubHeader.css';

type EditorSubHeaderProps = {
    activePanel: EditorPanel;
};

const PANEL_TITLES: Record<Exclude<EditorPanel, null>, string> = {
    tools: 'Drawing tools',
    shapes: 'Shapes',
    text: 'Text settings',
    images: 'Image library',
    uploads: 'Uploads',
};

export function EditorSubHeader({ activePanel }: EditorSubHeaderProps) {
    if (!activePanel) {
        return null;
    }

    return (
        <div className="editor-subheader">
            <strong>{PANEL_TITLES[activePanel]}</strong>
            <span>Choose an option from the panel to start editing.</span>
        </div>
    );
}
