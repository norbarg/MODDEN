// src/features/editor/ui/panels/shapes-panel/ShapesPanel.tsx
import type { EditorOption } from '../../../model/editorTypes';
import './ShapesPanel.css';

type ShapesPanelProps = {
    activeOption: EditorOption;
    onOptionChange: (option: EditorOption) => void;
};

const SHAPES = [
    { id: 'square', label: 'Square' },
    { id: 'triangle', label: 'Triangle' },
    { id: 'circle', label: 'Circle' },
    { id: 'diamond', label: 'Diamond' },
    { id: 'pentagon', label: 'Pentagon' },
];

export function ShapesPanel({
    activeOption,
    onOptionChange,
}: ShapesPanelProps) {
    return (
        <div className="editor-shapes-panel">
            <h3>Shapes</h3>

            <div className="editor-shapes-panel__list">
                {SHAPES.map((shape) => {
                    const isActive =
                        activeOption?.panel === 'shapes' &&
                        activeOption.id === shape.id;

                    return (
                        <button
                            className={`editor-shapes-panel__item ${
                                isActive
                                    ? 'editor-shapes-panel__item--active'
                                    : ''
                            }`}
                            type="button"
                            key={shape.id}
                            aria-label={shape.label}
                            title={shape.label}
                            onClick={() =>
                                onOptionChange({
                                    panel: 'shapes',
                                    id: shape.id,
                                })
                            }
                        >
                            <span
                                className={`editor-shapes-panel__shape editor-shapes-panel__shape--${shape.id}`}
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
