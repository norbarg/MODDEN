// src/features/editor/ui/panels/tools-panel/ToolsPanel.tsx
import type { CSSProperties } from 'react';
import type { EditorOption } from '../../../model/editorTypes';
import { EditorColorPicker } from '../../color-picker';
import { ToolSvgIcon } from './ToolSvgIcon';
import { ToolThicknessControl } from './ToolThicknessControl';

import cursorSvg from '../../../../../assets/editor-subsidebar/cursor.svg?raw';
import pencilSvg from '../../../../../assets/editor-subsidebar/pencil.svg?raw';
import markerSvg from '../../../../../assets/editor-subsidebar/marker.svg?raw';
import highliterSvg from '../../../../../assets/editor-subsidebar/highliter.svg?raw';
import eraserSvg from '../../../../../assets/editor-subsidebar/eraser.svg?raw';
import thicknessSvg from '../../../../../assets/editor-subsidebar/thickness.svg?raw';

import './ToolsPanel.css';

type ToolsPanelProps = {
    activeOption: EditorOption;
    toolColors: Record<string, string>;
    toolStrokeWidths: Record<string, number>;
    recentToolColors: string[];
    onOptionChange: (option: EditorOption) => void;
    onToolColorPreview: (toolId: string, color: string) => void;
    onToolColorCommit: (toolId: string, color: string) => void;
    onToolStrokeWidthChange: (toolId: string, strokeWidth: number) => void;
};

const TOOLS = [
    {
        id: 'pencil',
        label: 'Pencil',
        svg: pencilSvg,
        defaultColor: '#98BA61',
        replaceColors: ['#98BA61'],
        defaultStrokeWidth: 5,
    },
    {
        id: 'marker',
        label: 'Marker',
        svg: markerSvg,
        defaultColor: '#F8A1C4',
        replaceColors: ['#F8A1C4'],
        defaultStrokeWidth: 12,
    },
    {
        id: 'highliter',
        label: 'Highlighter',
        svg: highliterSvg,
        defaultColor: '#48D8FE',
        replaceColors: [],
        defaultStrokeWidth: 22,
    },
    {
        id: 'eraser',
        label: 'Eraser',
        svg: eraserSvg,
        defaultColor: '#FE5F96',
        replaceColors: [],
        defaultStrokeWidth: 28,
    },
];

function isDrawingToolId(id: string) {
    return TOOLS.some((tool) => tool.id === id);
}

export function ToolsPanel({
    activeOption,
    toolColors,
    toolStrokeWidths,
    recentToolColors,
    onOptionChange,
    onToolColorPreview,
    onToolColorCommit,
    onToolStrokeWidthChange,
}: ToolsPanelProps) {
    const isCursorActive =
        activeOption?.panel === 'tools' && activeOption.id === 'cursor';

    const activeToolId =
        activeOption?.panel === 'tools' && isDrawingToolId(activeOption.id)
            ? activeOption.id
            : 'pencil';

    const activeTool =
        TOOLS.find((tool) => tool.id === activeToolId) ?? TOOLS[0];

    const activeToolColor =
        toolColors[activeTool.id] ?? activeTool.defaultColor;

    const activeToolStrokeWidth =
        toolStrokeWidths[activeTool.id] ?? activeTool.defaultStrokeWidth;

    return (
        <div className="editor-panel editor-tools-panel">
            <h3>Tools</h3>

            <div className="editor-tools-panel__list">
                <button
                    className={`editor-tools-panel__cursor ${
                        isCursorActive
                            ? 'editor-tools-panel__cursor--active'
                            : ''
                    }`}
                    type="button"
                    aria-label="Cursor"
                    onClick={() =>
                        onOptionChange({
                            panel: 'tools',
                            id: 'cursor',
                        })
                    }
                >
                    <ToolSvgIcon
                        className="editor-tools-panel__cursor-icon"
                        svg={cursorSvg}
                    />
                </button>

                {TOOLS.map((tool) => {
                    const isActive =
                        activeOption?.panel === 'tools' &&
                        activeOption.id === tool.id;

                    const toolColor = toolColors[tool.id] ?? tool.defaultColor;

                    return (
                        <button
                            className={`editor-tools-panel__item ${
                                isActive
                                    ? 'editor-tools-panel__item--active'
                                    : ''
                            }`}
                            type="button"
                            key={tool.id}
                            onClick={() =>
                                onOptionChange({
                                    panel: 'tools',
                                    id: tool.id,
                                })
                            }
                        >
                            <ToolSvgIcon
                                className="editor-tools-panel__icon"
                                svg={tool.svg}
                                color={toolColor}
                                replaceColors={tool.replaceColors}
                            />

                            <span className="editor-tools-panel__label">
                                {tool.label}
                            </span>
                        </button>
                    );
                })}

                <EditorColorPicker
                    value={activeToolColor}
                    recentColors={recentToolColors}
                    triggerClassName="editor-tools-panel__color-picker"
                    onChangeStart={() => {}}
                    onPreview={(color) =>
                        onToolColorPreview(activeTool.id, color)
                    }
                    onCommit={(color) =>
                        onToolColorCommit(activeTool.id, color)
                    }
                >
                    <span
                        className="editor-tools-panel__color-dot"
                        style={
                            {
                                '--tool-color': activeToolColor,
                            } as CSSProperties
                        }
                    />
                </EditorColorPicker>

                <ToolThicknessControl
                    iconSvg={thicknessSvg}
                    value={activeToolStrokeWidth}
                    onChange={(strokeWidth) =>
                        onToolStrokeWidthChange(activeTool.id, strokeWidth)
                    }
                />
            </div>
        </div>
    );
}
