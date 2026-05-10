import type { EditorOption } from '../../../model/editorTypes';
import '../tools-panel/ToolsPanel.css';

type UploadsPanelProps = {
    activeOption: EditorOption;
    onOptionChange: (option: EditorOption) => void;
};

export function UploadsPanel({
    activeOption,
    onOptionChange,
}: UploadsPanelProps) {
    const isActive =
        activeOption?.panel === 'uploads' && activeOption.id === 'upload';

    return (
        <div className="editor-panel">
            <h3>Uploads</h3>

            <button
                className={isActive ? 'editor-panel__button--active' : ''}
                type="button"
                onClick={() =>
                    onOptionChange({
                        panel: 'uploads',
                        id: 'upload',
                    })
                }
            >
                Upload image
            </button>
        </div>
    );
}
