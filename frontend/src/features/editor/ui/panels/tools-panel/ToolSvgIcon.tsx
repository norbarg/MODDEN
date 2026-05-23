// src/features/editor/ui/panels/tools-panel/ToolSvgIcon.tsx
type ToolSvgIconProps = {
    svg: string;
    color?: string;
    replaceColors?: string[];
    className?: string;
};

export function ToolSvgIcon({
    svg,
    color,
    replaceColors = [],
    className,
}: ToolSvgIconProps) {
    let coloredSvg = svg;

    if (color) {
        coloredSvg = coloredSvg.replaceAll('__TOOL_COLOR__', color);

        coloredSvg = replaceColors.reduce((result, currentColor) => {
            return result.replaceAll(currentColor, color);
        }, coloredSvg);
    }

    return (
        <span
            className={className}
            dangerouslySetInnerHTML={{ __html: coloredSvg }}
        />
    );
}
