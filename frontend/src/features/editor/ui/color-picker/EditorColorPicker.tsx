// src/features/editor/ui/color-picker/EditorColorPicker.tsx
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from 'react';
import eyedropperIcon from '../../../../assets/editor-subheader/eyedropper.svg';
import colorPickerIcon from '../../../../assets/editor-subheader/color-picker.svg';
import './EditorColorPicker.css';

type RgbColor = {
    r: number;
    g: number;
    b: number;
};

type HsvColor = {
    h: number;
    s: number;
    v: number;
};

type EditorColorPickerProps = {
    value: string;
    recentColors: string[];
    triggerClassName?: string;
    onChangeStart?: () => void;
    onPreview: (color: string) => void;
    onCommit: (color: string) => void;
    children: ReactNode;
};

type EyeDropperResult = {
    sRGBHex: string;
};

type EyeDropperInstance = {
    open: () => Promise<EyeDropperResult>;
};

type EyeDropperConstructor = new () => EyeDropperInstance;

declare global {
    interface Window {
        EyeDropper?: EyeDropperConstructor;
    }
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function normalizeHex(value: string) {
    const trimmed = value.trim();

    if (!trimmed.startsWith('#')) {
        return `#${trimmed}`;
    }

    return trimmed;
}

function isHexColor(value: string) {
    return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function hexToRgb(hex: string): RgbColor {
    const safeHex = isHexColor(hex) ? hex : '#ffffff';

    return {
        r: parseInt(safeHex.slice(1, 3), 16),
        g: parseInt(safeHex.slice(3, 5), 16),
        b: parseInt(safeHex.slice(5, 7), 16),
    };
}

function rgbToHex({ r, g, b }: RgbColor) {
    const toHex = (value: number) =>
        clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0');

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsv({ r, g, b }: RgbColor): HsvColor {
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;

    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;

    let h = 0;

    if (delta !== 0) {
        if (max === red) {
            h = 60 * (((green - blue) / delta) % 6);
        } else if (max === green) {
            h = 60 * ((blue - red) / delta + 2);
        } else {
            h = 60 * ((red - green) / delta + 4);
        }
    }

    if (h < 0) {
        h += 360;
    }

    return {
        h,
        s: max === 0 ? 0 : delta / max,
        v: max,
    };
}

function hsvToRgb({ h, s, v }: HsvColor): RgbColor {
    const chroma = v * s;
    const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - chroma;

    let red = 0;
    let green = 0;
    let blue = 0;

    if (h >= 0 && h < 60) {
        red = chroma;
        green = x;
    } else if (h >= 60 && h < 120) {
        red = x;
        green = chroma;
    } else if (h >= 120 && h < 180) {
        green = chroma;
        blue = x;
    } else if (h >= 180 && h < 240) {
        green = x;
        blue = chroma;
    } else if (h >= 240 && h < 300) {
        red = x;
        blue = chroma;
    } else {
        red = chroma;
        blue = x;
    }

    return {
        r: (red + m) * 255,
        g: (green + m) * 255,
        b: (blue + m) * 255,
    };
}

export function EditorColorPicker({
    value,
    recentColors,
    triggerClassName,
    onChangeStart,
    onPreview,
    onCommit,
    children,
}: EditorColorPickerProps) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const saturationRef = useRef<HTMLDivElement | null>(null);
    const draftColorRef = useRef(value);

    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [draftColor, setDraftColor] = useState(value);
    const [hexInput, setHexInput] = useState(value.toUpperCase());
    const [isPickingColor, setIsPickingColor] = useState(false);

    useEffect(() => {
        draftColorRef.current = draftColor;
    }, [draftColor]);

    const hsv = useMemo(() => rgbToHsv(hexToRgb(draftColor)), [draftColor]);

    useEffect(() => {
        if (!isOpen) {
            setDraftColor(value);
            setHexInput(value.toUpperCase());
        }
    }, [isOpen, value]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (
                rootRef.current &&
                !rootRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setIsExpanded(false);
                onCommit(draftColor);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setIsExpanded(false);
                onCommit(draftColor);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [draftColor, isOpen, onCommit]);

    const previewColor = (color: string) => {
        const normalizedColor = color.toUpperCase();

        setDraftColor(normalizedColor);
        setHexInput(normalizedColor);
        onPreview(normalizedColor);

        return normalizedColor;
    };
    const applyInstantColor = (color: string) => {
        onChangeStart?.();

        const nextColor = previewColor(color);

        onCommit(nextColor);
    };

    const handleSaturationPointer = (clientX: number, clientY: number) => {
        const rect = saturationRef.current?.getBoundingClientRect();

        if (!rect) {
            return;
        }

        const s = clamp((clientX - rect.left) / rect.width, 0, 1);
        const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);

        const nextColor = rgbToHex(
            hsvToRgb({
                h: hsv.h,
                s,
                v,
            }),
        );

        previewColor(nextColor);
    };

    const handleSaturationMouseDown = (
        event: React.MouseEvent<HTMLDivElement>,
    ) => {
        onChangeStart?.();

        handleSaturationPointer(event.clientX, event.clientY);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            handleSaturationPointer(moveEvent.clientX, moveEvent.clientY);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            onCommit(draftColorRef.current);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleHueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextHue = Number(event.target.value);
        const nextColor = rgbToHex(
            hsvToRgb({
                ...hsv,
                h: nextHue,
            }),
        );

        previewColor(nextColor);
    };

    async function handleEyedropperPick() {
        if (!window.EyeDropper) {
            console.warn('EyeDropper API is not supported in this browser');
            return;
        }

        try {
            setIsPickingColor(true);

            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();

            if (!result?.sRGBHex) {
                return;
            }

            applyInstantColor(result.sRGBHex);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }

            console.error('Failed to pick color:', error);
        } finally {
            setIsPickingColor(false);
        }
    }

    return (
        <div className="editor-color-picker" ref={rootRef}>
            <button
                className={triggerClassName}
                type="button"
                aria-label="Change color"
                onClick={() => {
                    setIsOpen((currentValue) => !currentValue);
                }}
            >
                {children ?? (
                    <span
                        style={
                            {
                                '--editor-picked-color': value,
                            } as CSSProperties
                        }
                    />
                )}
            </button>

            {isOpen && (
                <div
                    className={`editor-color-picker-popover ${
                        isExpanded
                            ? 'editor-color-picker-popover--expanded'
                            : ''
                    }`}
                >
                    <div className="editor-color-picker-popover__quick-row">
                        <button
                            className="editor-color-picker-popover__wheel"
                            type="button"
                            aria-label="Open advanced color picker"
                            onClick={() => setIsExpanded((current) => !current)}
                        >
                            <img
                                src={colorPickerIcon}
                                alt=""
                                aria-hidden="true"
                            />
                        </button>

                        {recentColors.slice(0, 6).map((color) => {
                            const isActive =
                                color.toLowerCase() ===
                                draftColor.toLowerCase();

                            return (
                                <button
                                    className={`editor-color-picker-popover__swatch ${
                                        isActive
                                            ? 'editor-color-picker-popover__swatch--active'
                                            : ''
                                    }`}
                                    type="button"
                                    key={color}
                                    aria-label={`Use ${color}`}
                                    onClick={() => applyInstantColor(color)}
                                    style={
                                        {
                                            '--swatch-color': color,
                                        } as CSSProperties
                                    }
                                />
                            );
                        })}
                    </div>

                    {isExpanded && (
                        <div className="editor-color-picker-popover__advanced">
                            <div
                                className="editor-color-picker-popover__saturation"
                                ref={saturationRef}
                                onMouseDown={handleSaturationMouseDown}
                                style={
                                    {
                                        '--hue-color': `hsl(${hsv.h}, 100%, 50%)`,
                                    } as CSSProperties
                                }
                            >
                                <span
                                    className="editor-color-picker-popover__saturation-pointer"
                                    style={
                                        {
                                            left: `${hsv.s * 100}%`,
                                            top: `${(1 - hsv.v) * 100}%`,
                                        } as CSSProperties
                                    }
                                />
                            </div>

                            <div className="editor-color-picker-popover__control-row">
                                <button
                                    className="editor-color-picker-popover__eyedropper"
                                    type="button"
                                    aria-label="Pick color from screen"
                                    onClick={handleEyedropperPick}
                                    disabled={
                                        isPickingColor || !window.EyeDropper
                                    }
                                    title={
                                        !window.EyeDropper
                                            ? 'Eyedropper is not supported in this browser'
                                            : 'Pick color from screen'
                                    }
                                >
                                    <img
                                        src={eyedropperIcon}
                                        alt=""
                                        aria-hidden="true"
                                    />
                                </button>

                                <input
                                    className="editor-color-picker-popover__hue"
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={Math.round(hsv.h)}
                                    onMouseDown={() => onChangeStart?.()}
                                    onMouseUp={() =>
                                        onCommit(draftColorRef.current)
                                    }
                                    onChange={handleHueChange}
                                />
                            </div>

                            <div className="editor-color-picker-popover__hex-row">
                                <span
                                    className="editor-color-picker-popover__hex-dot"
                                    style={
                                        {
                                            '--hex-color': draftColor,
                                        } as CSSProperties
                                    }
                                />

                                <input
                                    value={hexInput}
                                    maxLength={7}
                                    spellCheck={false}
                                    onChange={(event) => {
                                        const nextValue = normalizeHex(
                                            event.target.value,
                                        ).toUpperCase();

                                        setHexInput(nextValue);

                                        if (isHexColor(nextValue)) {
                                            previewColor(nextValue);
                                        }
                                    }}
                                    onFocus={() => onChangeStart?.()}
                                    onBlur={() => {
                                        if (!isHexColor(hexInput)) {
                                            setHexInput(draftColor);
                                            return;
                                        }

                                        onCommit(draftColorRef.current);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
