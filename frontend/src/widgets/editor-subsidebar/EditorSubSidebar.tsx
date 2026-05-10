// src/widgets/editor-subsidebar/EditorSubSidebar.tsx
import type {
    EditorOption,
    EditorPanel,
} from '../../features/editor/model/editorTypes';
import { ToolsPanel } from '../../features/editor/ui/panels/tools-panel/ToolsPanel';
import { ShapesPanel } from '../../features/editor/ui/panels/shapes-panel/ShapesPanel';
import { TextPanel } from '../../features/editor/ui/panels/text-panel/TextPanel';
import { ImagesPanel } from '../../features/editor/ui/panels/images-panel/ImagesPanel';
import { UploadsPanel } from '../../features/editor/ui/panels/uploads-panel/UploadsPanel';
import './EditorSubSidebar.css';

type EditorSubSidebarProps = {
    activePanel: EditorPanel;
    activeOption: EditorOption;
    toolColors: Record<string, string>;
    toolStrokeWidths: Record<string, number>;
    recentToolColors: string[];
    onOptionChange: (option: EditorOption) => void;
    onToolColorPreview: (toolId: string, color: string) => void;
    onToolColorCommit: (toolId: string, color: string) => void;
    onToolStrokeWidthChange: (toolId: string, strokeWidth: number) => void;
};

export function EditorSubSidebar({
    activePanel,
    activeOption,
    toolColors,
    onOptionChange,
    toolStrokeWidths,
    recentToolColors,
    onToolColorPreview,
    onToolColorCommit,
    onToolStrokeWidthChange,
}: EditorSubSidebarProps) {
    if (!activePanel) {
        return null;
    }

    return (
        <aside className="editor-subsidebar">
            {activePanel === 'tools' && (
                <ToolsPanel
                    activeOption={activeOption}
                    toolColors={toolColors}
                    toolStrokeWidths={toolStrokeWidths}
                    recentToolColors={recentToolColors}
                    onOptionChange={onOptionChange}
                    onToolColorPreview={onToolColorPreview}
                    onToolColorCommit={onToolColorCommit}
                    onToolStrokeWidthChange={onToolStrokeWidthChange}
                />
            )}

            {activePanel === 'shapes' && (
                <ShapesPanel
                    activeOption={activeOption}
                    onOptionChange={onOptionChange}
                />
            )}

            {activePanel === 'text' && (
                <TextPanel
                    activeOption={activeOption}
                    onOptionChange={onOptionChange}
                />
            )}

            {activePanel === 'images' && (
                <ImagesPanel
                    activeOption={activeOption}
                    onOptionChange={onOptionChange}
                />
            )}

            {activePanel === 'uploads' && (
                <UploadsPanel
                    activeOption={activeOption}
                    onOptionChange={onOptionChange}
                />
            )}
        </aside>
    );
}
