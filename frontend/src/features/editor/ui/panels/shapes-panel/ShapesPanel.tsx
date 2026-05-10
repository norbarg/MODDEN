import type { EditorOption } from '../../../model/editorTypes';
import '../tools-panel/ToolsPanel.css';

type ShapesPanelProps = {
    activeOption: EditorOption;
    onOptionChange: (option: EditorOption) => void;
};

const SHAPES = [
    { id: 'rectangle', label: 'Rectangle' },
    { id: 'circle', label: 'Circle' },
    { id: 'line', label: 'Line' },
];

export function ShapesPanel({
    activeOption,
    onOptionChange,
}: ShapesPanelProps) {
    return (
        <div className="editor-panel">
            <h3>Shapes</h3>

            {SHAPES.map((shape) => {
                const isActive =
                    activeOption?.panel === 'shapes' &&
                    activeOption.id === shape.id;

                return (
                    <button
                        className={
                            isActive ? 'editor-panel__button--active' : ''
                        }
                        type="button"
                        key={shape.id}
                        onClick={() =>
                            onOptionChange({
                                panel: 'shapes',
                                id: shape.id,
                            })
                        }
                    >
                        {shape.label}
                    </button>
                );
            })}
        </div>
    );
}
