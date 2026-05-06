// src/widgets/editor-subsidebar/EditorSubSidebar.tsx
import type { EditorPanel } from '../../features/editor/model/editorTypes';
import { ToolsPanel } from '../../features/editor/ui/panels/tools-panel/ToolsPanel';
import { ShapesPanel } from '../../features/editor/ui/panels/shapes-panel/ShapesPanel';
import { TextPanel } from '../../features/editor/ui/panels/text-panel/TextPanel';
import { ImagesPanel } from '../../features/editor/ui/panels/images-panel/ImagesPanel';
import { UploadsPanel } from '../../features/editor/ui/panels/uploads-panel/UploadsPanel';
import './EditorSubSidebar.css';

type EditorSubSidebarProps = {
    activePanel: EditorPanel;
};

export function EditorSubSidebar({ activePanel }: EditorSubSidebarProps) {
    if (!activePanel) {
        return null;
    }

    return (
        <aside className="editor-subsidebar">
            {activePanel === 'tools' && <ToolsPanel />}
            {activePanel === 'shapes' && <ShapesPanel />}
            {activePanel === 'text' && <TextPanel />}
            {activePanel === 'images' && <ImagesPanel />}
            {activePanel === 'uploads' && <UploadsPanel />}
        </aside>
    );
}
