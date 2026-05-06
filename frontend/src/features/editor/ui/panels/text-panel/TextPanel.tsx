import '../tools-panel/ToolsPanel.css';

export function TextPanel() {
    return (
        <div className="editor-panel">
            <h3>Text</h3>

            <button type="button">Add heading</button>
            <button type="button">Add paragraph</button>
            <button type="button">Add small text</button>
        </div>
    );
}
