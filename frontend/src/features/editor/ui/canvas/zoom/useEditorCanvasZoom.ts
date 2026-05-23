// src/features/editor/ui/canvas/zoom/useEditorCanvasZoom.ts
import { useEffect, useRef } from 'react';

const MIN_ZOOM = 20;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;

function clampZoom(value: number) {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

type UseEditorCanvasZoomParams = {
    zoom: number;
    onZoomChange: (zoom: number) => void;
    canvasAreaRef: React.RefObject<HTMLElement | null>;
};

export function useEditorCanvasZoom({
    zoom,
    onZoomChange,
    canvasAreaRef,
}: UseEditorCanvasZoomParams) {
    const latestZoomRef = useRef(zoom);

    const canvasScale = zoom / 100;

    useEffect(() => {
        latestZoomRef.current = zoom;
    }, [zoom]);

    useEffect(() => {
        const canvasArea = canvasAreaRef.current;

        if (!canvasArea) {
            return;
        }

        const handleWheel = (event: WheelEvent) => {
            if (!event.ctrlKey && !event.metaKey) {
                return;
            }

            event.preventDefault();

            const zoomDirection = event.deltaY < 0 ? 1 : -1;
            const nextZoom = clampZoom(
                latestZoomRef.current + zoomDirection * ZOOM_STEP,
            );

            onZoomChange(nextZoom);
        };

        canvasArea.addEventListener('wheel', handleWheel, {
            passive: false,
        });

        return () => {
            canvasArea.removeEventListener('wheel', handleWheel);
        };
    }, [canvasAreaRef, onZoomChange]);

    const handleZoomIn = () => {
        onZoomChange(clampZoom(latestZoomRef.current + ZOOM_STEP));
    };

    const handleZoomOut = () => {
        onZoomChange(clampZoom(latestZoomRef.current - ZOOM_STEP));
    };

    return {
        canvasScale,
        handleZoomIn,
        handleZoomOut,
    };
}
