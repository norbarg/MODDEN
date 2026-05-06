// src/features/editor/ui/panels/tools-panel/ToolsPanel.tsx
import './ToolsPanel.css';

export function ToolsPanel() {
    return (
        <div className="editor-panel">
            <h3>Tools</h3>

            <button type="button">Pencil</button>
            <button type="button">Marker</button>
            <button type="button">Eraser</button>
        </div>
    );
}
