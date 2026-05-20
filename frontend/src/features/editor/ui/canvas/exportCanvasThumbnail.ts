// src/features/editor/ui/canvas/exportCanvasThumbnail.ts
import { StaticCanvas } from 'fabric';
import type { WorkspaceProject } from '../../../../shared/types/workspace';
import type { EditorScene } from '../../model/editorTypes';
import { createCanvasObject } from './canvasObjects';

type ExportCanvasThumbnailParams = {
    project: WorkspaceProject;
    scene: EditorScene;
};

export async function exportCanvasThumbnail({
    project,
    scene,
}: ExportCanvasThumbnailParams) {
    const canvasElement = document.createElement('canvas');

    const thumbnailCanvas = new StaticCanvas(canvasElement, {
        width: project.canvasWidth,
        height: project.canvasHeight,
        backgroundColor: scene.background.color,
        preserveObjectStacking: true,
        enableRetinaScaling: false,
    });

    try {
        const canvasObjects = await Promise.all(
            scene.objects.map((object) => createCanvasObject(object)),
        );

        canvasObjects.forEach((object) => {
            object.set({
                selectable: false,
                evented: false,
                hasControls: false,
                hasBorders: false,
            });

            thumbnailCanvas.add(object);
        });

        thumbnailCanvas.renderAll();

        return thumbnailCanvas.toDataURL({
            format: 'jpeg',
            quality: 0.82,
            multiplier: 0.35,
        });
    } catch (err) {
        console.error('Failed to export canvas thumbnail:', err);
        return null;
    } finally {
        void thumbnailCanvas.dispose();
    }
}
