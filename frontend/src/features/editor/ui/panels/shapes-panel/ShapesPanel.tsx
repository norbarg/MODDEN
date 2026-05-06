import '../tools-panel/ToolsPanel.css';

export function ShapesPanel() {
    return (
        <div className="editor-panel">
            <h3>Shapes</h3>

            <button type="button">Rectangle</button>
            <button type="button">Circle</button>
            <button type="button">Line</button>
        </div>
    );
}
