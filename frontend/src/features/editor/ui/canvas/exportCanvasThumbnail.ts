// src/features/editor/ui/canvas/exportCanvasThumbnail.ts
import type { Canvas } from 'fabric';

type ExportCanvasThumbnailParams = {
    canvas: Canvas | null;
    backgroundColor: string;
};

export function exportCanvasThumbnail({
    canvas,
    backgroundColor,
}: ExportCanvasThumbnailParams) {
    if (!canvas) {
        return null;
    }

    try {
        const exportedCanvas = canvas.toCanvasElement(0.35);

        const thumbnailCanvas = document.createElement('canvas');
        thumbnailCanvas.width = exportedCanvas.width;
        thumbnailCanvas.height = exportedCanvas.height;

        const context = thumbnailCanvas.getContext('2d');

        if (!context) {
            return null;
        }

        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
        context.drawImage(exportedCanvas, 0, 0);

        return thumbnailCanvas.toDataURL('image/jpeg', 0.82);
    } catch (err) {
        console.error('Failed to export canvas thumbnail:', err);
        return null;
    }
}
