import type { EditorOption } from '../../../model/editorTypes';
import '../tools-panel/ToolsPanel.css';

type ImagesPanelProps = {
    activeOption: EditorOption;
    onOptionChange: (option: EditorOption) => void;
};

export function ImagesPanel({
    activeOption,
    onOptionChange,
}: ImagesPanelProps) {
    const isActive =
        activeOption?.panel === 'images' && activeOption.id === 'image';

    return (
        <div className="editor-panel">
            <h3>Images</h3>

            <button
                className={isActive ? 'editor-panel__button--active' : ''}
                type="button"
                onClick={() =>
                    onOptionChange({
                        panel: 'images',
                        id: 'image',
                    })
                }
            >
                Browse images
            </button>
        </div>
    );
}
