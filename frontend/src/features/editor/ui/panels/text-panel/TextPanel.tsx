// src/features/editor/ui/panels/text-panel/TextPanel.tsx
import type { EditorOption } from '../../../model/editorTypes';
import '../tools-panel/ToolsPanel.css';

type TextPanelProps = {
    activeOption: EditorOption;
    onOptionChange: (option: EditorOption) => void;
};

const TEXT_OPTIONS = [
    { id: 'heading', label: 'Add heading' },
    { id: 'paragraph', label: 'Add paragraph' },
    { id: 'small-text', label: 'Add small text' },
];

export function TextPanel({ activeOption, onOptionChange }: TextPanelProps) {
    return (
        <div className="editor-panel">
            <h3>Text</h3>

            {TEXT_OPTIONS.map((textOption) => {
                const isActive =
                    activeOption?.panel === 'text' &&
                    activeOption.id === textOption.id;

                return (
                    <button
                        className={
                            isActive ? 'editor-panel__button--active' : ''
                        }
                        type="button"
                        key={textOption.id}
                        onClick={() =>
                            onOptionChange({
                                panel: 'text',
                                id: textOption.id,
                            })
                        }
                    >
                        {textOption.label}
                    </button>
                );
            })}
        </div>
    );
}
