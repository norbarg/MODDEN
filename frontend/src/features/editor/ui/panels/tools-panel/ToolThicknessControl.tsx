// src/features/editor/ui/panels/tools-panel/ToolThicknessControl.tsx
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ToolSvgIcon } from './ToolSvgIcon';

type ToolThicknessControlProps = {
    iconSvg: string;
    value: number;
    min?: number;
    max?: number;
    onChange: (value: number) => void;
};

export function ToolThicknessControl({
    iconSvg,
    value,
    min = 1,
    max = 100,
    onChange,
}: ToolThicknessControlProps) {
    const [isOpen, setIsOpen] = useState(false);
    const controlRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (!controlRef.current) {
                return;
            }

            if (!controlRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const progress = ((value - min) / (max - min)) * 100;

    return (
        <div
            className={`editor-tools-panel__thickness-wrap ${
                isOpen ? 'editor-tools-panel__thickness-wrap--open' : ''
            }`}
            ref={controlRef}
        >
            <button
                className="editor-tools-panel__thickness"
                type="button"
                aria-label="Tool thickness"
                onClick={() => setIsOpen((currentValue) => !currentValue)}
            >
                <ToolSvgIcon
                    className="editor-tools-panel__thickness-icon"
                    svg={iconSvg}
                />
            </button>

            {isOpen && (
                <div className="editor-tools-panel__thickness-popover">
                    <input
                        className="editor-tools-panel__thickness-range"
                        type="range"
                        min={min}
                        max={max}
                        value={value}
                        style={
                            {
                                '--thickness-progress': `${progress}%`,
                            } as CSSProperties
                        }
                        onChange={(event) =>
                            onChange(Number(event.target.value))
                        }
                    />

                    <span className="editor-tools-panel__thickness-value">
                        {value}
                    </span>
                </div>
            )}
        </div>
    );
}
